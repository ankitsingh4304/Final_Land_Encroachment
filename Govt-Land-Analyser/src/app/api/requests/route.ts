import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose"; 
import dbConnect from "@/lib/db";
import PendingRequest from "@/models/PendingRequest";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    // 1. Get the cookies object
    const cookieStore = await cookies();
    
    // 2. Fetch the correct cookie name: "auth_token"
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" }, 
        { status: 401 }
      );
    }

    // 3. Verify JWT
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" }, 
        { status: 401 }
      );
    }
    
    const userId = payload.id as string || payload.email as string;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session data" }, 
        { status: 401 }
      );
    }

    // 4. Connect to DB and parse body
    await dbConnect();
    const body = await req.json();

    // 5. Create the entry
    const newRequest = await PendingRequest.create({
      ...body,
      quotedBy: userId, 
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