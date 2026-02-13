import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Plot from "@/models/Plot";
import type { IndustrialAreaId } from "@/lib/config/areas";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const url = request.nextUrl;
    const areaParam = url.searchParams.get("area") as IndustrialAreaId | null;

    // Map industrial areas to underlying MongoDB collections.
    // - Industrial Sector 1 (area-1) → collection "plots"   (default)
    // - Industrial Sector 2 (area-2) → collection "plots1"
    // - Industrial Sector 3 (area-3) → collection "plots2"
    // - Fallback / others            → collection "plots"
    let collectionName = "plots";

    if (areaParam === "area-2") {
      collectionName = "plots1";
    } else if (areaParam === "area-3") {
      collectionName = "plots2";
    }

    // Use the underlying collection directly so we can support
    // multiple collections without defining separate models.
    const collection = mongoose.connection.collection(collectionName);
    const plots = await collection.find({}).toArray();

    return NextResponse.json(plots);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plots" }, { status: 500 });
  }
}