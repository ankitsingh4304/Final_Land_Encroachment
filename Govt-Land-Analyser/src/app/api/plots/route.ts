import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Plot from "@/models/Plot";

export async function GET() {
  try {
    await dbConnect();
    // Fetch all plots from the 'plots' collection
    const plots = await Plot.find({});
    return NextResponse.json(plots);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plots" }, { status: 500 });
  }
}