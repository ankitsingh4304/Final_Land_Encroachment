import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PendingRequest from "@/models/PendingRequest";
import Plot from "@/models/Plot";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { requestId, action } = await req.json();

    const request = await PendingRequest.findById(requestId);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "accept") {
      // 1. Update the master plot collection
      await Plot.findOneAndUpdate(
        { plotId: request.plotId },
        {
          bought: true,
          boughtBy: request.quotedBy, 
          allotmentDateTime: new Date(),
        }
      );

      // 2. Remove ALL pending requests for this plotId (including this one)
      // This ensures no competing bids remain once the plot is sold.
      await PendingRequest.deleteMany({ plotId: request.plotId });
      
      return NextResponse.json({ message: "Plot allotted and all competing bids cleared" });
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