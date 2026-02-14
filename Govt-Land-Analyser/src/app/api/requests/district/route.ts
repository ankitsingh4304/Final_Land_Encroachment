import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isDistrictAdmin, getCurrentUser } from "@/lib/auth";
import PendingRequest from "@/models/PendingRequest";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isDistrictAdmin(user)) {
      return NextResponse.json(
        { error: "Unauthorized: district admin only", requests: [] },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const requests = await PendingRequest.find({
      $or: [
        { workflowStage: "district_pending" },
        { workflowStage: { $exists: false } },
      ],
    })
      .sort({ submittedAt: 1 })
      .lean();

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("Error in /api/requests/district:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests", requests: [] },
      { status: 500 }
    );
  }
}
