// src/app/api/rooms/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Room } from "@/models/Room";

/**
 * DELETE /api/rooms/:id
 * Use `unknown` for the 2nd arg to satisfy Next.js route validator,
 * then narrow inside to `{ params: { id: string } }`.
 */
export async function DELETE(_req: Request, context: unknown) {
  try {
    await dbConnect();

    const { id } = (context as { params: { id: string } }).params;

    const deleted = await Room.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deletedId: id }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/rooms/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}