// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Appointment, IAppointment } from "@/models/Appointment";
import { Task, ITask } from "@/models/Task";
import { User } from "@/models/User";

type AppointmentLean = Pick<
  IAppointment,
  "date" | "time" | "doctorId" | "roomId" | "status"
> & {
  _id: unknown;
  patientId?: string;
  createdByEmployeeId?: string;
};

type TaskLean = Pick<
  ITask,
  | "title"
  | "createdBy"
  | "createdByRole"
  | "completed"
  | "completedByEmployeeId"
  | "createdAt"
> & { _id: unknown };

type UserLean = {
  _id?: unknown;
  employeeId?: string;
  role: "doctor" | "receptionist" | "officeManager";
  name?: string;
  email?: string;
};

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const start = (searchParams.get("start") || "").trim();
    const end = (searchParams.get("end") || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return NextResponse.json(
        { error: "Provide start and end as YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    const spanDays = Math.abs(+e - +s) / 86_400_000 + 1;
    if (spanDays > 31) {
      return NextResponse.json(
        { error: "Date range too large. Max 31 days." },
        { status: 400 }
      );
    }

    const [appts, tasks, users] = await Promise.all([
      Appointment.find({ date: { $gte: start, $lte: end } }).lean<AppointmentLean[]>(),
      Task.find({
        createdAt: { $gte: s, $lte: new Date(e.getTime() + 86_400_000 - 1) },
      }).lean<TaskLean[]>(),
      User.find({}).lean<UserLean[]>(),
    ]);

    // user maps
    const roleByEmpId = new Map<string, UserLean["role"]>();
    const nameByEmpId = new Map<string, string>();
    users.forEach((u) => {
      if (u.employeeId) {
        roleByEmpId.set(String(u.employeeId), u.role);
        nameByEmpId.set(
          String(u.employeeId),
          u.name || u.email || String(u.employeeId)
        );
      }
    });

    // Timely view
    const totalPerDay: Record<string, number> = {};
    const cancelledPerDay: Record<string, number> = {};
    const perRoom: Record<string, number> = {};
    let totalCancelled = 0;

    for (const a of appts) {
      totalPerDay[a.date] = (totalPerDay[a.date] || 0) + 1;
      perRoom[a.roomId] = (perRoom[a.roomId] || 0) + 1;
      if (a.status === "cancelled") {
        cancelledPerDay[a.date] = (cancelledPerDay[a.date] || 0) + 1;
        totalCancelled++;
      }
    }

    const totalRescheduled = tasks.filter((t) => t.createdBy === "system").length;

    // Staff view
    const perDoctor: Record<
      string,
      { doctorId: string; total: number; cancelled: number }
    > = {};
    for (const a of appts) {
      const entry =
        perDoctor[a.doctorId] ||
        (perDoctor[a.doctorId] = { doctorId: a.doctorId, total: 0, cancelled: 0 });
      entry.total++;
      if (a.status === "cancelled") entry.cancelled++;
    }

    // appointments created by receptionists (using createdByEmployeeId)
    const apptCreatedReceptionByName: Record<string, number> = {};
    for (const a of appts) {
      const creatorId = a.createdByEmployeeId;
      if (!creatorId) continue;
      const role = roleByEmpId.get(String(creatorId));
      if (role === "receptionist") {
        const name = nameByEmpId.get(String(creatorId)) || String(creatorId);
        apptCreatedReceptionByName[name] =
          (apptCreatedReceptionByName[name] || 0) + 1;
      }
    }

    // tasks created / completed by role
    const createdByDoctor: Record<string, number> = {};
    const completedByDoctor: Record<string, number> = {};
    const createdByReception: Record<string, number> = {};
    const completedByReception: Record<string, number> = {};

    for (const t of tasks) {
      if (t.createdByRole === "doctor") {
        const key = (t.createdBy || "Doctor").trim();
        createdByDoctor[key] = (createdByDoctor[key] || 0) + 1;
      } else if (t.createdByRole === "officeManager") {
        // not shown in UI right now
      } else if (t.createdByRole === undefined) {
        // if you later allow receptionists to create tasks, fill createdByReception here
      }

      if (t.completed && t.completedByEmployeeId) {
        const empId = String(t.completedByEmployeeId);
        const role = roleByEmpId.get(empId);
        const name = nameByEmpId.get(empId) || empId;
        if (role === "doctor") {
          completedByDoctor[name] = (completedByDoctor[name] || 0) + 1;
        } else if (role === "receptionist") {
          completedByReception[name] = (completedByReception[name] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      range: { start, end },
      timely: {
        totalPerDay,
        cancelledPerDay,
        perRoom,
        totalCancelled,
        totalRescheduled,
      },
      staff: {
        doctors: Object.values(perDoctor),
        appointmentsCreatedByReception: apptCreatedReceptionByName,
        tasks: {
          createdByDoctor,
          createdByReception, // currently empty unless you enable that flow
          completedByDoctor,
          completedByReception,
        },
      },
    });
  } catch (err) {
    console.error("GET /api/analytics error:", err);
    return NextResponse.json(
      { error: "Failed to compute analytics" },
      { status: 500 }
    );
  }
}