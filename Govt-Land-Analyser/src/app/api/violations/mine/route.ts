import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Violation } from "@/models/Violation";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", violation: null },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let violation = null;

    if (user.plotId && user.areaId) {
      violation = await Violation.findOne({
        plotId: String(user.plotId),
        areaId: String(user.areaId),
        violationStatus: true,
      });
    }

    if (!violation && user.email) {
      violation = await Violation.findOne({
        user_mail: user.email,
        violationStatus: true,
      });
    }

    if (!violation) {
      return NextResponse.json(
        { violation: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        violation: {
          id: violation._id.toString(),
          areaId: violation.areaId,
          plotId: violation.plotId,
          violationStatus: violation.violationStatus,
          reportPdfPath: violation.reportPdfPath,
          reportFileId: violation.reportFileId
            ? violation.reportFileId.toString()
            : null,
          reportUrl: violation.reportFileId
            ? `/api/reports/${violation.reportFileId.toString()}`
            : null,
          adminComments: violation.adminComments,
          analyzedAt: violation.analyzedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/violations/mine:", error);
    return NextResponse.json(
      { error: "Failed to fetch violation status", violation: null },
      { status: 500 }
    );
  }
}

