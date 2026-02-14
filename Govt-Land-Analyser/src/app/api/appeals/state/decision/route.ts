import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isStateAdmin, getCurrentUser } from "@/lib/auth";
import { Appeal } from "@/models/Appeal";
import { Violation } from "@/models/Violation";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStateAdmin(user)) {
      return NextResponse.json(
        { error: "Unauthorized: state admin only" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { appealId, action, remark } = body as {
      appealId: string;
      action: "approve" | "reject";
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
    if (appeal.stage !== "state_pending") {
      return NextResponse.json(
        { error: "Appeal is not pending at state level" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      appeal.stage = "state_approved";
      appeal.stateRemark = remark?.trim() || null;
      await appeal.save();
      const v = await Violation.findById(appeal.violation);
      if (v) {
        (v as any).violationStatus = false;
        (v as any).adminComments = ((v as any).adminComments || "") + " [Appeal upheld by State Admin.]";
        await v.save();
      }
      return NextResponse.json({
        message: "Appeal approved. Violation flag cleared.",
      });
    }

    if (action === "reject") {
      appeal.stage = "state_rejected";
      appeal.stateRemark = remark?.trim() || null;
      await appeal.save();
      return NextResponse.json({ message: "Appeal rejected by State Admin." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in /api/appeals/state/decision:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
