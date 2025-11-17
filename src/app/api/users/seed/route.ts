import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  await dbConnect();

  // Always clear existing users so names can update
  await User.deleteMany({});

  const users = await User.insertMany([
    {
      name: "Mazda",
      email: "manager@example.com",
      password: "password123",
      role: "officeManager",
      employeeId: "MGR-1001",
    },
    {
      name: "Jay",
      email: "reception@example.com",
      password: "password123",
      role: "receptionist",
      employeeId: "REC-2001",
    },
    {
      name: "Fred",
      email: "doctor@example.com",
      password: "password123",
      role: "doctor",
      employeeId: "DOC-3001",
      doctorId: "doc-1",
    },
  ]);

  return NextResponse.json({ ok: true, users });
}