// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Task, ITask } from "@/models/Task";

type TaskCreateBody = Pick<
  ITask,
  "title" | "description" | "patientId" | "notes" | "forType" | "dueDate" | "createdBy" | "createdByRole"
>;

export async function GET() {
  try {
    await dbConnect();
    const tasks = await Task.find({})
      .sort({ completed: 1, dueDate: 1, createdAt: -1 })
      .lean<ITask[]>();
    const out = tasks.map((t) => ({
      id: String(t._id),
      title: t.title,
      description: t.description,
      patientId: t.patientId,
      notes: t.notes,
      forType: t.forType,
      createdBy: t.createdBy,
      createdByRole: t.createdByRole,
      dueDate: t.dueDate,
      completed: !!t.completed,
      completedByEmployeeId: t.completedByEmployeeId,
      completedAt: t.completedAt,
    }));
    return NextResponse.json(out);
  } catch (e) {
    console.error("GET /api/tasks error", e);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = (await req.json()) as TaskCreateBody;

    if (!body?.title || !body?.description || !body?.forType || !body?.dueDate) {
      return NextResponse.json(
        { error: "title, description, forType, dueDate are required" },
        { status: 400 }
      );
    }

    const created = await Task.create({
      title: body.title,
      description: body.description,
      patientId: body.patientId,
      notes: body.notes,
      forType: body.forType,
      dueDate: new Date(body.dueDate),
      createdBy: body.createdBy,
      createdByRole: body.createdByRole,
      completed: false,
    });

    return NextResponse.json(
      { id: String(created._id) },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/tasks error", e);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}