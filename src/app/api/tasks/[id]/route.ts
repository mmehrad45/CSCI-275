// src/app/api/tasks/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Task } from "@/models/Task";

/**
 * PATCH /api/tasks/:id
 * Use `unknown` for Next.js route arg, then narrow; return LEAN object to avoid Mongoose Document typing issues.
 */
export async function PATCH(req: Request, context: unknown) {
  try {
    await dbConnect();

    const { id } = (context as { params: { id: string } }).params;
    const body = (await req.json()) as Record<string, unknown>;

    // Allowlist updatable fields (match your Task schema)
    const allow = new Set([
      "title",
      "description",
      "notes",
      "dueDate",
      "patientId",               // ← schema uses patientId (not forPatientId)
      "assignedToEmployeeId",
      "createdByEmployeeId",
      "status",
      "priority",
      "completedByEmployeeId",
    ]);

    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (allow.has(k)) updates[k] = v;
    }

    // Auto-stamp completion time if marked completed
    if (updates.status === "completed" && !("completedAt" in updates)) {
      updates.completedAt = new Date().toISOString();
    }

    // Return a plain object instead of a Mongoose Document to satisfy TS
    const doc = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      lean: true,
    });

    if (!doc) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Explicit lean type (fields optional to match schema variants)
    type TaskLean = {
      _id: unknown;
      title?: string;
      description?: string;
      notes?: string;
      status?: string;
      priority?: string;
      dueDate?: string | Date | null;
      patientId?: string | null;
      assignedToEmployeeId?: string | null;
      createdByEmployeeId?: string | null;
      completedByEmployeeId?: string | null;
      completedAt?: string | Date | null;
      createdAt?: string | Date | null;
      updatedAt?: string | Date | null;
    };

    const t = doc as TaskLean;

    const out = {
      id: String(t._id),
      title: t.title ?? "",
      description: t.description ?? "",
      notes: t.notes ?? "",
      status: t.status ?? "open",
      priority: t.priority ?? "normal",
      dueDate: t.dueDate ?? null,
      patientId: t.patientId ?? null,
      assignedToEmployeeId: t.assignedToEmployeeId ?? null,
      createdByEmployeeId: t.createdByEmployeeId ?? null,
      completedByEmployeeId: t.completedByEmployeeId ?? null,
      completedAt: t.completedAt ?? null,
      createdAt: t.createdAt ?? null,
      updatedAt: t.updatedAt ?? null,
    };

    return NextResponse.json(out, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/tasks/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}