import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PendingRequest from "@/models/PendingRequest";
import Plot from "@/models/Plot";
import { Lease } from "@/models/Lease";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { requestId, action } = await req.json();

    const request = await PendingRequest.findById(requestId);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "accept") {
      const allotmentDate = new Date();

      // 1. Update the master plot collection
      const plot = await Plot.findOneAndUpdate(
        { plotId: request.plotId },
        {
          bought: true,
          boughtBy: request.quotedBy,
          allotmentDateTime: allotmentDate,
        },
        { new: true }
      );

      // 2. Create / update lease record for this plot & user
      const user = await User.findOne({ email: request.quotedBy });

      const leaseYears = plot?.leaseDuration ?? 5; // fallback if needed
      const leaseEndDate = new Date(
        allotmentDate.getFullYear() + leaseYears,
        allotmentDate.getMonth(),
        allotmentDate.getDate()
      );

      if (user) {
        await Lease.findOneAndUpdate(
          { plotId: request.plotId },
          {
            $set: {
              user: user._id,
              userEmail: user.email,
              plotId: request.plotId,
              areaId: user.areaId ?? null,
              leaseYears,
              allotmentDate,
              leaseEndDate,
              status: "active",
              bidPrice: request.quotedPrice,
            },
          },
          { upsert: true, new: true }
        );
      }

      // 3. Remove ALL pending requests for this plotId (including this one)
      // This ensures no competing bids remain once the plot is sold.
      await PendingRequest.deleteMany({ plotId: request.plotId });

      return NextResponse.json({
        message: "Plot allotted, lease created, and all competing bids cleared",
      });
    } else {
      // 3. If declined, only delete the specific request
      await PendingRequest.findByIdAndDelete(requestId);
      return NextResponse.json({ message: "Request declined" });
    }

  } catch (error) {
    console.error("Decision Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}