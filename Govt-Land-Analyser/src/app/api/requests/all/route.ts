import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PendingRequest from "@/models/PendingRequest";

export async function GET() {
  try {
    await dbConnect();
    // Fetch all documents from the 'pending' collection
    const requests = await PendingRequest.find({}).sort({ submittedAt: -1 });
    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}