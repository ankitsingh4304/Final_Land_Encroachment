import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Lease } from "@/models/Lease";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ lease: null }, { status: 401 });
    }

    await connectToDatabase();

    const lease = await Lease.findOne({ user: user._id });
    if (!lease) {
      return NextResponse.json({ lease: null }, { status: 200 });
    }

    const now = new Date();
    let status = lease.status;
    if (lease.leaseEndDate < now && status === "active") {
      status = "expired";
      lease.status = "expired";
      await lease.save();
    }

    const remainingMs = lease.leaseEndDate.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));

    return NextResponse.json(
      {
        lease: {
          id: lease._id.toString(),
          plotId: lease.plotId,
          areaId: lease.areaId,
          leaseYears: lease.leaseYears,
          allotmentDate: lease.allotmentDate,
          leaseEndDate: lease.leaseEndDate,
          status,
          bidPrice: lease.bidPrice,
          remainingDays,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/lease/mine:", error);
    return NextResponse.json(
      { error: "Failed to fetch lease", lease: null },
      { status: 500 }
    );
  }
}

