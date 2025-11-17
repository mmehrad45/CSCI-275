// src/app/(app)/appointments/all/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRole } from "@/context/RoleContext";

/** ------------ Local types ------------ */
type Appointment = {
  id: string;
  date: string;      // "YYYY-MM-DD"
  time: string;      // "HH:mm"
  doctorId: string;
  roomId: string;
  patientId?: string;
  patientName?: string;
  notes?: string;
  status?: "scheduled" | "cancelled";
};

type Doctor = { id: string; name: string; email?: string };
type Room = { id: string; name: string; code?: string };

/** ------------ Helpers ------------ */
const toLocalISODate = (d: Date) => {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const parseDateTime = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
};

const addMinutes = (dt: Date, mins: number) => new Date(dt.getTime() + mins * 60000);

const icsDateTimeUTC = (d: Date) => {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mm = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
};

const escapeICS = (s: string) =>
  (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

const downloadFile = (filename: string, content: string, mime = "text/calendar") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** ------------ Page ------------ */
export default function AppointmentsAllPage() {
  const { role, doctorId: currentDoctorId } = useRole();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Filters / view state
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [groupBy, setGroupBy] = useState<"doctor" | "room">("doctor");

  // Patient name search
  const [search, setSearch] = useState("");

  // ICS modal state
  const [icsOpen, setIcsOpen] = useState(false);
  const [icsDoctorId, setIcsDoctorId] = useState<string>("");
  const [icsStart, setIcsStart] = useState<string>("");
  const [icsEnd, setIcsEnd] = useState<string>("");

  async function refresh() {
    setLoading(true);
    const [aRes, dRes, rRes] = await Promise.all([
      fetch("/api/appointments"),
      fetch("/api/doctors"),
      fetch("/api/rooms"),
    ]);
    const [a, d, r] = await Promise.all([aRes.json(), dRes.json(), rRes.json()]);
    setAppointments(a || []);
    setDoctors(d || []);
    setRooms(r || []);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (cancelled) return;
      // ICS defaults
      const today = new Date();
      const nextWeek = addMinutes(today, 60 * 24 * 7);
      setIcsStart(toLocalISODate(today));
      setIcsEnd(toLocalISODate(nextWeek));
      if (role === "doctor" && currentDoctorId) setIcsDoctorId(currentDoctorId);
      else if (doctors.length) setIcsDoctorId(doctors[0]?.id);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, currentDoctorId]);

  // Role-based visible appointments (doctors see only their own)
  const visibleAppointments = useMemo(() => {
    if (role === "doctor" && currentDoctorId) {
      return appointments.filter((a) => a.doctorId === currentDoctorId);
    }
    return appointments;
  }, [appointments, role, currentDoctorId]);

  // Patient-name filtered view (applies to both list & calendar)
  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleAppointments;
    return visibleAppointments.filter((a) =>
      (a.patientName || "").toLowerCase().includes(q)
    );
  }, [visibleAppointments, search]);

  /** ---------------- ICS EXPORT ---------------- */
  const onExportICS = () => {
    if (!icsDoctorId || !icsStart || !icsEnd) return;

    const start = new Date(icsStart + "T00:00:00");
    const end = new Date(icsEnd + "T23:59:59");

    const doctor = doctors.find((d) => d.id === icsDoctorId);
    const selected = visibleAppointments.filter((a) => {
      if (a.doctorId !== icsDoctorId) return false;
      const dt = parseDateTime(a.date, a.time);
      return dt >= start && dt <= end;
    });

    const calName = doctor ? `ClinicFlow – ${doctor.name}` : "ClinicFlow – Appointments";

    let ics = "BEGIN:VCALENDAR\r\n";
    ics += "VERSION:2.0\r\n";
    ics += "PRODID:-//ClinicFlow//Appointments//EN\r\n";
    ics += `X-WR-CALNAME:${escapeICS(calName)}\r\n`;

    selected.forEach((a) => {
      const startDT = parseDateTime(a.date, a.time);
      const endDT = addMinutes(startDT, 30);
      const uid = `${a.id}@clinicflow`;
      const summary = a.patientName ? `Appointment – ${a.patientName}` : "Appointment";
      const description = a.notes ? escapeICS(a.notes) : "";

      ics += "BEGIN:VEVENT\r\n";
      ics += `UID:${uid}\r\n`;
      ics += `DTSTAMP:${icsDateTimeUTC(new Date())}\r\n`;
      ics += `DTSTART:${icsDateTimeUTC(startDT)}\r\n`;
      ics += `DTEND:${icsDateTimeUTC(endDT)}\r\n`;
      ics += `SUMMARY:${escapeICS(summary)}\r\n`;
      if (description) ics += `DESCRIPTION:${description}\r\n`;
      ics += "END:VEVENT\r\n";
    });

    ics += "END:VCALENDAR\r\n";

    const filename = `appointments_${doctor ? doctor.name.replace(/\s+/g, "_") : "doctor"}_${icsStart}_to_${icsEnd}.ics`;
    downloadFile(filename, ics);
    setIcsOpen(false);
  };

  /** ---------------- Calendar View Data ---------------- */
  const [calStart, setCalStart] = useState<string>(() => toLocalISODate(new Date()));

  const calDays: string[] = useMemo(() => {
    const base = new Date(calStart + "T00:00:00");
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addMinutes(base, 60 * 24 * i);
      days.push(toLocalISODate(d));
    }
    return days;
  }, [calStart]);

  const prettyDay = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    const w = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    return `${w} ${d.getMonth() + 1}/${d.getDate()}`;
  };

  const calendarGroups = useMemo(() => {
    if (groupBy === "doctor") {
      return doctors.map((d) => ({
        id: d.id,
        name: d.name,
      }));
    }
    return rooms.map((r) => ({
      id: r.id,
      name: r.name + (r.code ? ` (${r.code})` : ""),
    }));
  }, [groupBy, doctors, rooms]);

  const calendarData = useMemo(() => {
    const map = new Map<string, Map<string, Appointment[]>>();
    calendarGroups.forEach((g) => map.set(g.id, new Map<string, Appointment[]>()));
    filteredAppointments.forEach((a) => {
      const day = a.date;
      if (!calDays.includes(day)) return;
      const groupId = groupBy === "doctor" ? a.doctorId : a.roomId;
      if (!map.has(groupId)) return;
      const dayMap = map.get(groupId)!;
      if (!dayMap.has(day)) dayMap.set(day, []);
      dayMap.get(day)!.push(a);
    });
    return map;
  }, [filteredAppointments, calendarGroups, calDays, groupBy]);

  /** --------- Cancel / Delete actions ---------- */
  const cancelAppointment = async (id: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    await refresh();
  };

  const deleteAppointment = async (id: string) => {
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    await refresh();
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-gray-100">Appointments</h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* Patient search */}
          <div className="flex items-center gap-2 text-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200 placeholder-neutral-500"
              placeholder="Search by patient name"
            />
            {search && (
              <button
                type="button"
                className="rounded-lg border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800"
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="rounded-xl border border-neutral-700 p-1 text-xs">
            <button
              className={`rounded-lg px-3 py-1 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
              onClick={() => setViewMode("list")}
              type="button"
            >
              List
            </button>
            <button
              className={`rounded-lg px-3 py-1 ${viewMode === "calendar" ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
              onClick={() => setViewMode("calendar")}
              type="button"
            >
              Calendar
            </button>
          </div>

          {/* Group by */}
          {viewMode === "calendar" && (
            <div className="rounded-xl border border-neutral-700 p-1 text-xs">
              <button
                className={`rounded-lg px-3 py-1 ${groupBy === "doctor" ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
                onClick={() => setGroupBy("doctor")}
                type="button"
              >
                By Doctor
              </button>
              <button
                className={`rounded-lg px-3 py-1 ${groupBy === "room" ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
                onClick={() => setGroupBy("room")}
                type="button"
              >
                By Room
              </button>
            </div>
          )}

          {/* ICS export button */}
          <button
            type="button"
            onClick={() => setIcsOpen(true)}
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            Export .ics
          </button>
        </div>
      </header>

      {/* ----------- LIST VIEW ----------- */}
      {viewMode === "list" && (
        <div className="rounded-2xl border border-neutral-800">
          {loading ? (
            <div className="p-4 text-sm text-neutral-300">Loading…</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-4 text-sm text-neutral-400">No appointments.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900 text-neutral-300">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Doctor</th>
                  <th className="px-3 py-2">Room</th>
                  <th className="px-3 py-2">Patient</th>
                  <th className="px-3 py-2">Notes</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => {
                  const dName = doctors.find((d) => d.id === a.doctorId)?.name || "—";
                  const rName = rooms.find((r) => r.id === a.roomId)?.name || "—";
                  return (
                    <tr key={a.id} className="border-t border-neutral-800">
                      <td className="px-3 py-2">{a.date}</td>
                      <td className="px-3 py-2">{a.time}</td>
                      <td className="px-3 py-2">{dName}</td>
                      <td className="px-3 py-2">{rName}</td>
                      <td className="px-3 py-2">{a.patientName || "—"}</td>
                      <td className="px-3 py-2">{a.notes || "—"}</td>
                      <td className="px-3 py-2">{a.status || "scheduled"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            className="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
                            onClick={() => cancelAppointment(a.id)}
                            disabled={a.status === "cancelled"}
                          >
                            Cancel
                          </button>
                          <button
                            className="rounded border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-900/20"
                            onClick={() => deleteAppointment(a.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ----------- CALENDAR VIEW ----------- */}
      {viewMode === "calendar" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-neutral-300">Week starting</label>
            <input
              type="date"
              value={calStart}
              onChange={(e) => setCalStart(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-200"
            />
          </div>

          <div className="overflow-auto rounded-2xl border border-neutral-800">
            {/* Header row: days */}
            <div className="grid" style={{ gridTemplateColumns: `160px repeat(${calDays.length}, minmax(140px, 1fr))` }}>
              <div className="bg-neutral-900 p-2 text-xs text-neutral-300"> {groupBy === "doctor" ? "Doctor" : "Room"} </div>
              {calDays.map((d) => (
                <div key={d} className="bg-neutral-900 p-2 text-xs text-neutral-300">
                  {prettyDay(d)}
                </div>
              ))}
            </div>

            {/* Rows per doctor/room */}
            {calendarGroups.length === 0 ? (
              <div className="p-4 text-sm text-neutral-400">No {groupBy}s defined.</div>
            ) : (
              calendarGroups.map((g) => (
                <div
                  key={g.id}
                  className="grid border-t border-neutral-800"
                  style={{ gridTemplateColumns: `160px repeat(${calDays.length}, minmax(140px, 1fr))` }}
                >
                  <div className="p-2 text-sm text-neutral-200">{g.name}</div>
                  {calDays.map((day) => {
                    const list = calendarData.get(g.id)?.get(day) || [];
                    return (
                      <div key={day} className="min-h-[84px] border-l border-neutral-800 p-2">
                        <div className="flex flex-col gap-2">
                          {list.map((a) => (
                            <div
                              key={a.id}
                              className={`rounded-md px-2 py-1 text-xs ring-1 ${
                                a.status === "cancelled"
                                  ? "bg-yellow-600/20 text-yellow-200 ring-yellow-600/40"
                                  : "bg-blue-600/20 text-blue-200 ring-blue-600/40"
                              }`}
                              title={`${a.time} ${a.patientName || ""}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium">{a.time}</div>
                                <div className="flex gap-1">
                                  <button
                                    className="rounded border border-neutral-600 px-1 py-0.5 text-[10px] hover:bg-neutral-800 disabled:opacity-50"
                                    onClick={() => cancelAppointment(a.id)}
                                    disabled={a.status === "cancelled"}
                                    title="Cancel"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="rounded border border-red-700 px-1 py-0.5 text-[10px] text-red-300 hover:bg-red-900/20"
                                    onClick={() => deleteAppointment(a.id)}
                                    title="Delete"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <div className="truncate">
                                {groupBy === "doctor"
                                  ? (rooms.find((r) => r.id === a.roomId)?.name || "Room")
                                  : (doctors.find((d) => d.id === a.doctorId)?.name || "Doctor")}
                                {" • "}
                                {a.patientName || "Patient"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------- ICS MODAL ----------- */}
      {icsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-100">
            <h2 className="mb-3 text-base font-semibold">Export appointments (.ics)</h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-300">Doctor</label>
                <select
                  value={icsDoctorId}
                  onChange={(e) => setIcsDoctorId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-300">Start date</label>
                  <input
                    type="date"
                    value={icsStart}
                    onChange={(e) => setIcsStart(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-300">End date</label>
                  <input
                    type="date"
                    value={icsEnd}
                    onChange={(e) => setIcsEnd(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800"
                onClick={() => setIcsOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                onClick={onExportICS}
                disabled={!icsDoctorId || !icsStart || !icsEnd}
              >
                Download .ics
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}