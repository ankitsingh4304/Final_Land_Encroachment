import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import PendingRequest from "@/models/PendingRequest";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await req.json();

    const newRequest = await PendingRequest.create({
      ...body,
      quotedBy: user.email,
      workflowStage: "district_pending",
    });

    // Final Success Branch
    return NextResponse.json(
      { message: "Request Saved", id: newRequest._id }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("Critical API Error:", error);
    // Final Error Branch
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}