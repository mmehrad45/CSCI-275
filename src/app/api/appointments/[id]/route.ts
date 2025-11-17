// src/app/api/appointments/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Appointment } from "@/models/Appointment";

/**
 * DELETE /api/appointments/:id
 * Removes an appointment by id.
 * Keep the 2nd arg as unknown; narrow inside to satisfy Next.js route validator.
 */
export async function DELETE(_req: Request, context: unknown) {
  try {
    await dbConnect();

    const { id } = (context as { params: { id: string } }).params;

    const deleted = await Appointment.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deletedId: id }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/appointments/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}