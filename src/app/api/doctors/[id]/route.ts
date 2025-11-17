// src/app/api/doctors/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Doctor } from "@/models/Doctor";

/**
 * Keep the second argument untyped (`unknown`) to avoid Next.js'
 * route signature validator rejecting custom types like `Params`.
 * We narrow inside with a safe assertion.
 */
export async function DELETE(_req: Request, context: unknown) {
  try {
    await dbConnect();

    const { id } = (context as { params: { id: string } }).params;

    const deleted = await Doctor.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deletedId: id }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/doctors/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete doctor" },
      { status: 500 }
    );
  }
}