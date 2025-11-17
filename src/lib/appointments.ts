import type { Patient } from "@/context/PatientContext";

export type Doctor = {
  id: string;
  name: string;
};

export type Room = {
  id: string;
  name: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  roomId: string;
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:MM"
  notes: string;
  createdAt: number; // unix ms timestamp
};

export const DOCTORS: Doctor[] = [
  { id: "dr-chen", name: "Dr. Alice Chen" },
  { id: "dr-singh", name: "Dr. Ravi Singh" },
  { id: "dr-martinez", name: "Dr. Carla Martinez" },
];

export const ROOMS: Room[] = [
  { id: "rm-101", name: "Room 101" },
  { id: "rm-102", name: "Room 102" },
  { id: "rm-201", name: "Room 201" },
];

export function haveTimeConflict(a: { date: string; time: string }, b: { date: string; time: string }): boolean {
  return a.date === b.date && a.time === b.time;
}

export function isDoctorBooked(
  appointments: Appointment[],
  doctorId: string,
  date: string,
  time: string,
): boolean {
  return appointments.some((appt) => appt.doctorId === doctorId && haveTimeConflict(appt, { date, time }));
}

export function isRoomBooked(
  appointments: Appointment[],
  roomId: string,
  date: string,
  time: string,
): boolean {
  return appointments.some((appt) => appt.roomId === roomId && haveTimeConflict(appt, { date, time }));
}

export function isPatientBooked(
  appointments: Appointment[],
  patientId: string,
  date: string,
  time: string,
): boolean {
  return appointments.some((appt) => appt.patientId === patientId && haveTimeConflict(appt, { date, time }));
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Local (floating) date-time, no timezone suffix.
function toICSLocalDateTime(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
}

// DTSTAMP in UTC with Z
function nowAsICSDateTimeUTC(): string {
  const now = new Date();
  return (
    now.getUTCFullYear().toString() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    "T" +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds()) +
    "Z"
  );
}

function escapeICStext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Generate an .ics calendar for a single doctor.
 * The caller should already filter `appointments` to that doctor.
 */
export function generateICSForDoctor(
  doctor: Doctor,
  appointments: Appointment[],
  patients: Patient[],
): string {
  const dtStamp = nowAsICSDateTimeUTC();

  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//ClinicFlow//Appointments//EN");

  for (const appt of appointments) {
    const patient = patients.find((p) => p.id === appt.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient";
    const room = ROOMS.find((r) => r.id === appt.roomId);
    const roomName = room ? room.name : "Unknown room";

    const dtStart = toICSLocalDateTime(appt.date, appt.time);

    // treat each appointment as 30 minutes long in the calendar
    const [y, m, d] = appt.date.split("-").map(Number);
    const [hh, mm] = appt.time.split(":").map(Number);
    const startDate = new Date(y, m - 1, d, hh, mm);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    const dtEnd = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(
      endDate.getDate(),
    )}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

    const summary = `Visit with ${patientName}`;
    const description = appt.notes ? escapeICStext(appt.notes) : "";

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${appt.id}@clinicflow.local`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeICStext(summary)}`);
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    lines.push(`LOCATION:${escapeICStext(roomName)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}