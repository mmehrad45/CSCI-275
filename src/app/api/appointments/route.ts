// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Appointment, IAppointment } from "@/models/Appointment";
import { Patient } from "@/models/Patient";

/** Lightweight lean docs */
type AppointmentLean = Pick<
  IAppointment,
  "date" | "time" | "doctorId" | "roomId" | "patientId" | "status"
> & { _id: unknown };

type PatientLean = { _id: unknown; firstName?: string; lastName?: string };

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n || "0", 10));
  return h * 60 + m;
};
const overlaps = (t1: string, t2: string, slotMin = 30) =>
  Math.abs(toMinutes(t1) - toMinutes(t2)) < slotMin;

export async function GET() {
  try {
    await dbConnect();

    const appts = await Appointment.find({}).lean<AppointmentLean[]>();

    const patientIds = Array.from(
      new Set((appts.map((a) => a.patientId).filter(Boolean) as string[]))
    );
    let pMap = new Map<string, string>();
    if (patientIds.length) {
      const patients = await Patient.find(
        { _id: { $in: patientIds } },
        { firstName: 1, lastName: 1 }
      ).lean<PatientLean[]>();
      pMap = new Map(
        patients.map((p) => [
          String(p._id),
          [p.firstName, p.lastName].filter(Boolean).join(" ").trim(),
        ])
      );
    }

    const result = appts.map((a) => ({
      id: String(a._id),
      date: a.date,
      time: a.time,
      doctorId: a.doctorId,
      roomId: a.roomId,
      patientId: a.patientId ? String(a.patientId) : undefined,
      patientName: a.patientId ? pMap.get(String(a.patientId)) : undefined,
      notes: (a as unknown as { notes?: string }).notes || "",
      status: a.status || "scheduled",
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/appointments error:", err);
    return NextResponse.json(
      { error: "Failed to load appointments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = (await req.json()) as {
      patientId?: string;
      date?: string;
      time?: string;
      doctorId?: string;
      roomId?: string;
      notes?: string;
      createdByEmployeeId?: string;
    };

    const { patientId, date, time, doctorId, roomId, notes, createdByEmployeeId } = body;

    if (!patientId || !date || !time || !doctorId || !roomId) {
      return NextResponse.json(
        { error: "Missing required fields (patient, date, time, doctor, room)" },
        { status: 400 }
      );
    }

    const p = await Patient.findById(patientId).lean<PatientLean | null>();
    if (!p) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    const patientName = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();

    const sameDay = await Appointment.find({ date }).lean<AppointmentLean[]>();
    const conflict = sameDay.some((a) => {
      if (a.patientId && String(a.patientId) === String(patientId) && overlaps(a.time, time))
        return true;
      if (String(a.doctorId) === String(doctorId) && overlaps(a.time, time)) return true;
      if (String(a.roomId) === String(roomId) && overlaps(a.time, time)) return true;
      return false;
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Conflicting appointment (patient/doctor/room already booked)." },
        { status: 409 }
      );
    }

    const created = await Appointment.create({
      patientId,
      patientName,
      date,
      time,
      doctorId,
      roomId,
      notes: notes || "",
      status: "scheduled",
      ...(createdByEmployeeId ? { createdByEmployeeId } : {}),
    });

    return NextResponse.json(
      {
        id: String(created._id),
        patientId: String(created.patientId),
        patientName: created.patientName,
        date: created.date,
        time: created.time,
        doctorId: created.doctorId,
        roomId: created.roomId,
        notes: created.notes || "",
        status: created.status || "scheduled",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/appointments error:", err);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}