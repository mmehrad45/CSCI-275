// src/app/api/patients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Patient } from "@/models/Patient";

type PatientLean = {
  _id: unknown;
  firstName?: string;
  lastName?: string;
  phone?: string;
  healthNumber?: string;
  email?: string;
  notes?: string;
};

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("search") || "").trim();

    const filter =
      q.length >= 2
        ? {
            $or: [
              { firstName: new RegExp(q, "i") },
              { lastName: new RegExp(q, "i") },
              { phone: new RegExp(q, "i") },
              { email: new RegExp(q, "i") },
              { healthNumber: new RegExp(q, "i") },
              { notes: new RegExp(q, "i") },
            ],
          }
        : {};

    // IMPORTANT: include email and notes in the projection
    const docs = await Patient.find(filter, {
      firstName: 1,
      lastName: 1,
      phone: 1,
      healthNumber: 1,
      email: 1,
      notes: 1,
    }).lean<PatientLean[]>();

    const out = docs.map((p) => {
      const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
      return {
        id: String(p._id),
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        fullName: fullName || "(no name)",
        phone: p.phone ?? "",
        email: p.email ?? "",
        healthNumber: p.healthNumber ?? "",
        notes: p.notes ?? "",
      };
    });

    return NextResponse.json(out);
  } catch (e) {
    console.error("GET /api/patients", e);
    return NextResponse.json({ error: "Failed to load patients" }, { status: 500 });
  }
}