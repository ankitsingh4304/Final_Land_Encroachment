import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isStateAdmin, getCurrentUser } from "@/lib/auth";
import PendingRequest from "@/models/PendingRequest";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isStateAdmin(user)) {
      return NextResponse.json(
        { error: "Unauthorized: state admin only", requests: [] },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const requests = await PendingRequest.find({
      workflowStage: "state_pending",
    })
      .sort({ districtApprovedAt: 1 })
      .lean();

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("Error in /api/requests/state:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests", requests: [] },
      { status: 500 }
    );
  }
}
