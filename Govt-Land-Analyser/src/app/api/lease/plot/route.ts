import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Lease } from "@/models/Lease";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const plotIdRaw = searchParams.get("plotId");
    if (!plotIdRaw) {
      return NextResponse.json(
        { error: "plotId is required" },
        { status: 400 }
      );
    }

    const plotId = Number(plotIdRaw);
    if (Number.isNaN(plotId)) {
      return NextResponse.json(
        { error: "plotId must be a number" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const lease = await Lease.findOne({ plotId });
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
          userEmail: lease.userEmail,
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
    console.error("Error in /api/lease/plot:", error);
    return NextResponse.json(
      { error: "Failed to fetch lease for plot", lease: null },
      { status: 500 }
    );
  }
}

