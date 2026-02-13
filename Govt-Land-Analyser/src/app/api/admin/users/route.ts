import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { User } from "@/models/User";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const users = await User.find({ role: "user" })
      .select("name email plotId areaId createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        plotId: u.plotId ?? null,
        areaId: u.areaId ?? null,
        createdAt: u.createdAt,
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, areaId, plotId } = body as {
      userId?: string;
      areaId?: string;
      plotId?: string;
    };

    if (!userId || !areaId || !plotId) {
      return NextResponse.json(
        { error: "userId, areaId and plotId are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          areaId: String(areaId),
          plotId: String(plotId),
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plotId: user.plotId ?? null,
        areaId: user.areaId ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/users:", error);
    return NextResponse.json(
      { error: "Failed to assign plot to user" },
      { status: 500 }
    );
  }
}

