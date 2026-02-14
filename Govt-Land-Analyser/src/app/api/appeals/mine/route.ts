import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Appeal } from "@/models/Appeal";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", appeals: [] },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const appeals = await Appeal.find({ user: user._id })
      .populate("violation", "areaId plotId adminComments violationStatus")
      .sort({ createdAt: -1 })
      .lean();

    const serialized = appeals.map((a: any) => ({
      id: a._id?.toString(),
      violationId: a.violation?._id?.toString(),
      userMessage: a.userMessage,
      stage: a.stage,
      districtRemark: a.districtRemark,
      districtDecision: a.districtDecision,
      stateRemark: a.stateRemark,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return NextResponse.json({ appeals: serialized }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/appeals/mine:", error);
    return NextResponse.json(
      { error: "Failed to fetch appeals", appeals: [] },
      { status: 500 }
    );
  }
}
