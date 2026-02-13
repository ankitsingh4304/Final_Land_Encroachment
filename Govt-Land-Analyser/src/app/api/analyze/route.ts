import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import mongoose from "mongoose";
import { getIndustrialAreaById } from "@/lib/config/areas";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

type AnalyzeRequestBody = {
  areaId?: string;
};

function runPythonAnalysis(options: {
  pythonBin: string;
  scriptPath: string;
  officialPath: string;
  satellitePath: string;
  outputDir: string;
}) {
  const { pythonBin, scriptPath, officialPath, satellitePath, outputDir } =
    options;

  return new Promise<void>((resolve, reject) => {
    const child = spawn(pythonBin, [scriptPath, officialPath, satellitePath, outputDir], {
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
      console.log("[map-superimpose stdout]", data.toString());
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
      console.error("[map-superimpose stderr]", data.toString());
    });

    child.on("error", (err) => {
      const errorMsg = err.message.includes("ENOENT") 
        ? `Python executable not found: ${pythonBin}. Please check MAP_ANALYSIS_PYTHON_BIN environment variable.`
        : `Failed to spawn Python process: ${err.message}`;
      reject(new Error(errorMsg));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        const errorMsg = stderr || stdout || "Unknown error";
        reject(
          new Error(
            `Python script exited with code ${code}.\n\nOutput:\n${stdout}\n\nErrors:\n${stderr}`
          )
        );
      }
    });
  });
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: admin access required" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as AnalyzeRequestBody;
    const areaId = body.areaId;

    if (!areaId) {
      return NextResponse.json(
        { error: "areaId is required" },
        { status: 400 }
      );
    }

    const area = getIndustrialAreaById(areaId as any);
    if (!area) {
      return NextResponse.json(
        { error: `Unknown areaId: ${areaId}` },
        { status: 400 }
      );
    }

    // Map public URLs to absolute filesystem paths
    const officialPath = path.join(
      process.cwd(),
      "public",
      area.officialMapPath.replace(/^\//, "")
    );
    const satellitePath = path.join(
      process.cwd(),
      "public",
      area.satelliteMapPath.replace(/^\//, "")
    );

    const outputDir =
      process.env.MAP_ANALYSIS_OUTPUT_DIR ||
      path.join(process.cwd(), "public", "reports", area.id);

    const useMock = process.env.MAP_ANALYSIS_USE_MOCK === "true";

    if (useMock) {
      // For local UI testing without Python set up.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockPdfPath = `/reports/${area.id}/mock-encroachment-report.pdf`;
      const mockImagePath = `/reports/${area.id}/mock-output-overlay.png`;

      return NextResponse.json(
        {
          success: true,
          areaId: area.id,
          usedMock: true,
          reportPdfPath: mockPdfPath,
          outputImagePath: mockImagePath,
          reportFileId: null,
          reportUrl: null,
        },
        { status: 200 }
      );
    }

    const pythonBin = process.env.MAP_ANALYSIS_PYTHON_BIN || "python";
    const scriptPath = process.env.MAP_ANALYSIS_SCRIPT_PATH;

    if (!scriptPath) {
      return NextResponse.json(
        {
          error:
            "MAP_ANALYSIS_SCRIPT_PATH is not configured. Set it to the map-superimpose main script.",
        },
        { status: 500 }
      );
    }

    // Check if script file exists
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        {
          error: `Python script not found at: ${scriptPath}`,
          details: "Please verify MAP_ANALYSIS_SCRIPT_PATH in your .env.local file",
        },
        { status: 500 }
      );
    }

    // Check if input image files exist
    if (!fs.existsSync(officialPath)) {
      return NextResponse.json(
        {
          error: `Official map image not found at: ${officialPath}`,
          details: `Expected path: ${area.officialMapPath}`,
        },
        { status: 500 }
      );
    }

    if (!fs.existsSync(satellitePath)) {
      return NextResponse.json(
        {
          error: `Satellite map image not found at: ${satellitePath}`,
          details: `Expected path: ${area.satelliteMapPath}`,
        },
        { status: 500 }
      );
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await runPythonAnalysis({
      pythonBin,
      scriptPath,
      officialPath,
      satellitePath,
      outputDir,
    });

    // By convention, assume the Python script writes to these filenames.
    const pdfFileName =
      process.env.MAP_ANALYSIS_PDF_NAME || "encroachment-report.pdf";
    const imageFileName =
      process.env.MAP_ANALYSIS_IMAGE_NAME || "encroachment-overlay.png";

    const reportPdfPath = `/reports/${area.id}/${pdfFileName}`;
    const outputImagePath = `/reports/${area.id}/${imageFileName}`;

    // Absolute filesystem paths of the generated artifacts
    const pdfFsPath = path.join(outputDir, pdfFileName);

    // Verify PDF was generated
    if (!fs.existsSync(pdfFsPath)) {
      return NextResponse.json(
        {
          error: `PDF report was not generated. Expected at: ${pdfFsPath}`,
          details: "The Python script may have completed but did not produce the expected output file.",
        },
        { status: 500 }
      );
    }

    // Store the PDF into MongoDB GridFS
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("MongoDB connection not ready for GridFS");
    }

    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "reports",
    });

    const uploadStream = bucket.openUploadStream(pdfFileName, {
      contentType: "application/pdf",
      metadata: {
        areaId: area.id,
      },
    });

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(pdfFsPath)
        .on("error", reject)
        .pipe(uploadStream)
        .on("error", reject)
        .on("finish", () => resolve());
    });

    const fileId = uploadStream.id as mongoose.Types.ObjectId;
    const reportUrl = `/api/reports/${fileId.toString()}`;

    return NextResponse.json(
      {
        success: true,
        areaId: area.id,
        usedMock: false,
        reportPdfPath,
        outputImagePath,
        reportFileId: fileId.toString(),
        reportUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/analyze:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { 
        error: "Failed to run encroachment analysis",
        details: errorMessage,
        suggestion: process.env.MAP_ANALYSIS_USE_MOCK !== "true" 
          ? "Consider setting MAP_ANALYSIS_USE_MOCK=true for testing, or check Python script path and dependencies."
          : undefined
      },
      { status: 500 }
    );
  }
}

