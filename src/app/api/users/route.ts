// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

type UserLean = {
  _id: unknown;
  name?: string;
  email: string;
  role: "doctor" | "receptionist" | "officeManager";
  employeeId?: string;
};

type CreateBody = {
  name: string;
  email: string;
  role: "doctor" | "receptionist" | "officeManager";
  employeeId?: string;
  password?: string;
};

export async function GET() {
  try {
    await dbConnect();
    const docs = await User.find({}, { name: 1, email: 1, role: 1, employeeId: 1 }).lean<UserLean[]>();
    const out = docs.map((u) => ({
      id: String(u._id),
      name: u.name || u.email,
      email: u.email,
      role: u.role,
      employeeId: u.employeeId ?? null,
    }));
    return NextResponse.json(out);
  } catch (e) {
    console.error("GET /api/users", e);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = (await req.json()) as CreateBody;
    const created = await User.create(body);
    return NextResponse.json(
      {
        id: String(created._id),
        name: created.name || created.email,
        email: created.email,
        role: created.role,
        employeeId: created.employeeId ?? null,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/users", e);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}