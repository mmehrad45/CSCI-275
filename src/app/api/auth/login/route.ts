// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

type LoginBody = { email: string; password: string };

type UserLean = {
  _id: unknown;
  name?: string;
  email: string;
  role: "doctor" | "receptionist" | "officeManager";
  employeeId?: string | null;
  password?: string | null;       // plain-text demo password
};

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { email, password } = (await req.json()) as LoginBody;

    const user = await User.findOne({ email }).lean<UserLean | null>();

    if (!user || !user.password || user.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        id: String(user._id),
        name: user.name || user.email,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId ?? null,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error in POST /api/auth/login:", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}