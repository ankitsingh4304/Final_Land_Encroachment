import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Violation } from "@/models/Violation";
import type { IndustrialAreaId } from "@/lib/config/areas";

interface FlagViolationBody {
  areaId?: string;
  plotId?: string;
  adminComments?: string;
  reportPdfPath?: string;
  reportFileId?: string;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: admin only" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as FlagViolationBody;
    const { areaId, plotId, adminComments, reportPdfPath, reportFileId } = body;

    if (!areaId || !plotId) {
      return NextResponse.json(
        { error: "areaId and plotId are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const areaIdTyped = areaId as IndustrialAreaId;
    const plotIdNum = Number(plotId);
    const collectionName =
      areaIdTyped === "area-2"
        ? "plots1"
        : areaIdTyped === "area-3"
          ? "plots2"
          : "plots";
    const plotsCollection = mongoose.connection.collection(collectionName);
    const plotDoc = await plotsCollection.findOne({
      plotId: Number.isNaN(plotIdNum) ? plotId : plotIdNum,
    });
    const plotDocAny = plotDoc as { user_gmail?: string; boughtBy?: string } | null;
    const userEmail =
      plotDocAny?.user_gmail ?? plotDocAny?.boughtBy ?? null;

    const violation = await Violation.findOneAndUpdate(
      { areaId: String(areaId), plotId: String(plotId) },
      {
        $set: {
          user_mail: userEmail,
          violationStatus: true,
          reportPdfPath: reportPdfPath ?? undefined,
          reportFileId: reportFileId
            ? new mongoose.Types.ObjectId(reportFileId)
            : undefined,
          adminComments: adminComments ?? undefined,
          analyzedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        areaId: violation.areaId,
        plotId: violation.plotId,
        user_mail: violation.user_mail ?? null,
        userEmail: violation.user_mail ?? null,
        violationStatus: violation.violationStatus,
        reportPdfPath: violation.reportPdfPath,
        reportFileId: violation.reportFileId
          ? violation.reportFileId.toString()
          : null,
        adminComments: violation.adminComments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/violations/flag:", error);
    return NextResponse.json(
      { error: "Failed to flag violation" },
      { status: 500 }
    );
  }
}

