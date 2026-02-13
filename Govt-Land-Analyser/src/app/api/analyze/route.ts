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

    let stderr = "";

    child.stderr.on("data", (data) => {
      stderr += data.toString();
      console.error("[map-superimpose stderr]", data.toString());
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `map-superimpose script exited with code ${code}. Stderr: ${stderr}`
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
    return NextResponse.json(
      { error: "Failed to run encroachment analysis" },
      { status: 500 }
    );
  }
}

