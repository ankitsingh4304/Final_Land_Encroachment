import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isDistrictAdmin, getCurrentUser } from "@/lib/auth";
import { Appeal } from "@/models/Appeal";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isDistrictAdmin(user)) {
      return NextResponse.json(
        { error: "Unauthorized: district admin only", appeals: [] },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const appeals = await Appeal.find({
      stage: "district_pending",
    })
      .populate("user", "name email")
      .populate("violation", "areaId plotId adminComments user_mail")
      .sort({ createdAt: 1 })
      .lean();

    const serialized = appeals.map((a: any) => ({
      ...a,
      id: a._id?.toString?.() ?? a._id,
      _id: a._id?.toString?.() ?? a._id,
      violationId: a.violation?._id?.toString?.() ?? a.violation?._id,
    }));

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error("Error in /api/appeals/district:", error);
    return NextResponse.json(
      { error: "Failed to fetch appeals", appeals: [] },
      { status: 500 }
    );
  }
}
