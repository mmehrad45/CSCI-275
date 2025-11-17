// src/app/api/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Room } from "@/models/Room";

type RoomLean = { _id: unknown; name: string; code?: string };

export async function GET() {
  try {
    await dbConnect();
    const docs = await Room.find({}, { name: 1, code: 1 }).lean<RoomLean[]>();
    const out = docs.map((r) => ({ id: String(r._id), name: r.name, code: r.code }));
    return NextResponse.json(out);
  } catch (e) {
    console.error("GET /api/rooms", e);
    return NextResponse.json({ error: "Failed to load rooms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = (await req.json()) as { name: string; code?: string };
    const created = await Room.create({ name: body.name, code: body.code });
    return NextResponse.json(
      { id: String(created._id), name: created.name, code: created.code },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/rooms", e);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}