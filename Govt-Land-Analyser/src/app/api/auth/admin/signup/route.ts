import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, type UserRole } from "@/models/User";
import { hashPassword, signAuthToken } from "@/lib/auth";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req: NextRequest) {
  try {
    const {
      name,
      email,
      password,
      contactNumber,
      adminSecret,
      adminLevel,
    } = await req.json();

    if (!ADMIN_SECRET) {
      return NextResponse.json(
        { message: "Admin registration is not configured" },
        { status: 503 }
      );
    }

    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { message: "Invalid admin secret" },
        { status: 403 }
      );
    }

    if (!name || !email || !password || !contactNumber || !adminLevel) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const allowedLevels: UserRole[] = [
      "state_admin",
      "district_admin",
      "block_admin",
    ];
    if (!allowedLevels.includes(adminLevel)) {
      return NextResponse.json(
        { message: "Invalid admin level" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { message: "Email is already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      contactNumber,
      role: adminLevel,
    });

    const token = signAuthToken(user);
    const res = NextResponse.json(
      {
        message: "Admin account created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Admin signup error", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
