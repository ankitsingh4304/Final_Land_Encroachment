import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Application } from "@/models/Application";
import { getCurrentUser } from "@/lib/auth";

// Create new application (user)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "user") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      latitude,
      longitude,
      addressDescription,
      quotedPrice,
    }: {
      latitude: number;
      longitude: number;
      addressDescription?: string;
      quotedPrice: number;
    } = await req.json();

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof quotedPrice !== "number"
    ) {
      return NextResponse.json(
        { message: "Location and quoted price are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const application = await Application.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      contactNumber: user.contactNumber,
      latitude,
      longitude,
      addressDescription,
      quotedPrice,
      status: "pending",
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Create application error", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get applications: users see their own; admins see all
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const filter =
      user.role === "user"
        ? { user: user._id }
        : {}; // any admin level sees all applications

    const applications = await Application.find(filter).sort({
      createdAt: -1,
    });

    return NextResponse.json({ applications }, { status: 200 });
  } catch (error) {
    console.error("List applications error", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

