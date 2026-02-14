import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isStateAdmin, getCurrentUser } from "@/lib/auth";
import { Appeal } from "@/models/Appeal";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isStateAdmin(user)) {
      return NextResponse.json(
        { error: "Unauthorized: state admin only", appeals: [] },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const appeals = await Appeal.find({
      stage: "state_pending",
    })
      .populate("user", "name email")
      .populate("violation", "areaId plotId adminComments user_mail")
      .sort({ updatedAt: 1 })
      .lean();

    const serialized = appeals.map((a: any) => ({
      ...a,
      id: a._id?.toString?.() ?? a._id,
      _id: a._id?.toString?.() ?? a._id,
      violationId: a.violation?._id?.toString?.() ?? a.violation?._id,
    }));

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error("Error in /api/appeals/state:", error);
    return NextResponse.json(
      { error: "Failed to fetch appeals", appeals: [] },
      { status: 500 }
    );
  }
}
