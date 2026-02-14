import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isDistrictAdmin, getCurrentUser } from "@/lib/auth";
import PendingRequest from "@/models/PendingRequest";

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
    const { requestId, action } = body as { requestId: string; action: "approve" | "reject" };

    const id = typeof requestId === "string" ? requestId.trim() : requestId?.toString?.();
    if (!id) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const request = await PendingRequest.findById(id).lean();
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const stage = (request as any).workflowStage;
    if (stage && stage !== "district_pending") {
      return NextResponse.json(
        { error: "Request is not pending at district level" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const updated = await PendingRequest.findByIdAndUpdate(
        id,
        {
          $set: {
            workflowStage: "state_pending",
            districtApprovedAt: new Date(),
          },
        },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
      }
      return NextResponse.json({
        message: "Request approved and forwarded to State Admin",
      });
    }

    if (action === "reject") {
      await PendingRequest.findByIdAndUpdate(id, {
        $set: {
          workflowStage: "rejected",
          rejectedAt: new Date(),
          rejectedBy: "district",
        },
      });
      return NextResponse.json({ message: "Request rejected by District Authority" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in /api/requests/district/decision:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
