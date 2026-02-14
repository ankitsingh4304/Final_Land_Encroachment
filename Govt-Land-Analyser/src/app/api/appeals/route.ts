import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Appeal } from "@/models/Appeal";
import { Violation } from "@/models/Violation";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { violationId, userMessage } = body as { violationId: string; userMessage: string };

    if (!violationId || !userMessage?.trim()) {
      return NextResponse.json(
        { error: "violationId and userMessage are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const violation = await Violation.findById(violationId);
    if (!violation) {
      return NextResponse.json({ error: "Violation not found" }, { status: 404 });
    }
    if (!violation.violationStatus) {
      return NextResponse.json(
        { error: "This violation is not currently flagged" },
        { status: 400 }
      );
    }
    const userMail = (violation as any).user_mail;
    if (userMail !== user.email) {
      return NextResponse.json(
        { error: "You can only appeal for violations flagged against you" },
        { status: 403 }
      );
    }

    const existingDistrictPending = await Appeal.findOne({
      violation: violationId,
      user: user._id,
      stage: "district_pending",
    });
    if (existingDistrictPending) {
      return NextResponse.json(
        { error: "You already have an appeal pending at District. Wait for their decision." },
        { status: 400 }
      );
    }

    const rejectedByDistrict = await Appeal.findOne({
      violation: violationId,
      user: user._id,
      stage: "district_rejected",
    });
    const initialStage = rejectedByDistrict ? "state_pending" : "district_pending";

    const appeal = await Appeal.create({
      user: user._id,
      violation: violationId,
      userMessage: userMessage.trim(),
      stage: initialStage,
    });

    return NextResponse.json(
      { message: "Appeal submitted", appealId: appeal._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/appeals:", error);
    return NextResponse.json(
      { error: "Failed to submit appeal" },
      { status: 500 }
    );
  }
}
