// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

/**
 * DELETE /api/users/:id
 * Use `unknown` for 2nd arg to satisfy Next.js 15 route validator.
 * Narrow inside to `{ params: { id: string } }`.
 */
export async function DELETE(_req: Request, context: unknown) {
  try {
    await dbConnect();

    const { id } = (context as { params: { id: string } }).params;

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deletedId: id }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/users/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}