import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Violation } from "@/models/Violation";

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

    const user = await User.findOne({
      plotId: String(plotId),
      areaId: String(areaId),
    });

    const violation = await Violation.findOneAndUpdate(
      { areaId: String(areaId), plotId: String(plotId) },
      {
        $set: {
          user: user?._id ?? null,
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
    ).populate("user");

    return NextResponse.json(
      {
        success: true,
        areaId: violation.areaId,
        plotId: violation.plotId,
        userId: user?._id?.toString() ?? null,
        userEmail: (violation.user as any)?.email ?? null,
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

