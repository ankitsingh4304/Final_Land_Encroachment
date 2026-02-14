import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isDistrictAdmin, getCurrentUser } from "@/lib/auth";
import { Appeal } from "@/models/Appeal";

const DISTRICT_APPROVED_REMARK =
  "Appeal heard and found correct by district admin";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isDistrictAdmin(user)) {
      return NextResponse.json(
        { error: "Unauthorized: district admin only" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { appealId, action, remark } = body as {
      appealId: string;
      action: "approve" | "reject" | "forward";
      remark?: string;
    };

    if (!appealId || !action) {
      return NextResponse.json(
        { error: "appealId and action are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const appeal = await Appeal.findById(appealId);
    if (!appeal) {
      return NextResponse.json({ error: "Appeal not found" }, { status: 404 });
    }
    if (appeal.stage !== "district_pending") {
      return NextResponse.json(
        { error: "Appeal is not pending at district level" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      appeal.stage = "state_pending";
      appeal.districtRemark = remark?.trim() || DISTRICT_APPROVED_REMARK;
      appeal.districtDecision = "approved";
      await appeal.save();
      return NextResponse.json({
        message: "Appeal approved and forwarded to State Admin with remark",
      });
    }

    if (action === "reject") {
      appeal.stage = "district_rejected";
      appeal.districtRemark = remark?.trim() || null;
      appeal.districtDecision = "rejected";
      await appeal.save();
      return NextResponse.json({
        message: "Appeal rejected. User may appeal directly to State Admin.",
      });
    }

    if (action === "forward") {
      appeal.stage = "state_pending";
      appeal.districtRemark = remark?.trim() || "Forwarded to State Admin for decision.";
      appeal.districtDecision = "forwarded";
      await appeal.save();
      return NextResponse.json({
        message: "Appeal forwarded to State Admin",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in /api/appeals/district/decision:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
