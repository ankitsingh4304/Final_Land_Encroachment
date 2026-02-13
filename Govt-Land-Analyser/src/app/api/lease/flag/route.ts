import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Lease } from "@/models/Lease";

interface FlagLeaseBody {
  leaseId?: string;
  plotId?: number;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as FlagLeaseBody;
    const { leaseId, plotId } = body;

    if (!leaseId && typeof plotId !== "number") {
      return NextResponse.json(
        { error: "leaseId or numeric plotId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query: any = leaseId ? { _id: leaseId } : { plotId };

    const lease = await Lease.findOne(query);
    if (!lease) {
      return NextResponse.json(
        { error: "Lease not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    if (lease.leaseEndDate < now) {
      lease.status = "warning_sent";
      await lease.save();
    } else {
      // If not technically expired yet, still mark as warning_sent as per admin action
      lease.status = "warning_sent";
      await lease.save();
    }

    return NextResponse.json(
      {
        success: true,
        leaseId: lease._id.toString(),
        status: lease.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/lease/flag:", error);
    return NextResponse.json(
      { error: "Failed to flag lease" },
      { status: 500 }
    );
  }
}

