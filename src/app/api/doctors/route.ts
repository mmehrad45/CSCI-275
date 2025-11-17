// src/app/api/doctors/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Doctor } from "@/models/Doctor"; // or User with role=doctor

type DoctorLean = { _id: unknown; name: string };

export async function GET() {
  try {
    await dbConnect();

    const docs = await Doctor.find({}, { name: 1 }).lean<DoctorLean[]>();
    const out = docs.map((d) => ({ id: String(d._id), name: d.name }));
    return NextResponse.json(out);
  } catch (e) {
    console.error("GET /api/doctors", e);
    return NextResponse.json({ error: "Failed to load doctors" }, { status: 500 });
  }
}