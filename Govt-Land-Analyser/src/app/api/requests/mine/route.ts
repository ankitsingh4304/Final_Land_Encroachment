import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import PendingRequest from "@/models/PendingRequest";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", requests: [] },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const requests = await PendingRequest.find({ quotedBy: user.email })
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json(
      { requests: requests.map((r) => ({ ...r, id: (r as any)._id?.toString() })) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/requests/mine:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests", requests: [] },
      { status: 500 }
    );
  }
}
