// src/app/(app)/appointments/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";

type Doctor = { id: string; name: string };
type Room = { id: string; name: string; code?: string };
type Patient = {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  healthNumber?: string;
};

export default function NewAppointmentPage() {
  const router = useRouter();
  const { employeeId } = useRole(); // <-- we will send this in the POST body

  // form state
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<string>("");
  const [patientPickedName, setPatientPickedName] = useState<string>("");

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  const [doctorId, setDoctorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // reference lists
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const formValid = useMemo(
    () => !!(patientId && date && time && doctorId && roomId),
    [patientId, date, time, doctorId, roomId]
  );

  // load doctors/rooms
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [dRes, rRes] = await Promise.all([fetch("/api/doctors"), fetch("/api/rooms")]);
      const [d, r] = await Promise.all([dRes.json(), rRes.json()]);
      if (!cancelled) {
        setDoctors(d || []);
        setRooms(r || []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // patient search (debounced)
  useEffect(() => {
    const q = patientQuery.trim();
    if (q.length < 2) {
      setPatientResults([]);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as Patient[];
        setPatientResults(data ?? []);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [patientQuery]);

  const pickPatient = (p: Patient) => {
    setPatientId(p.id);
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
    setPatientPickedName(name || "(unnamed)");
    setPatientQuery(name);
    setPatientResults([]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    const payload = {
      patientId,
      date,
      time,
      doctorId,
      roomId,
      notes: notes || "",
      // 👇 send creator to server for analytics
      createdByEmployeeId: employeeId || undefined,
    };

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Conflicting appointment (doctor/room/patient already booked).");
      return;
    }

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed to create appointment.");
      return;
    }

    router.push("/appointments/all");
  };

  return (
    <section className="max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold text-gray-100">Create appointment</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-neutral-800 p-4">
        {/* Patient search */}
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Patient</label>
          <input
            value={patientQuery}
            onChange={(e) => {
              setPatientQuery(e.target.value);
              setPatientId("");
              setPatientPickedName("");
            }}
            placeholder=""
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
          />
          {patientResults.length > 0 && (
            <div className="rounded-lg border border-neutral-700 bg-neutral-900">
              {patientResults.map((p) => {
                const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "(unnamed)";
                const sub = [p.healthNumber, p.phone].filter(Boolean).join(" • ");
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-800"
                    onClick={() => pickPatient(p)}
                  >
                    <div className="text-neutral-100">{name}</div>
                    {sub && <div className="text-xs text-neutral-400">{sub}</div>}
                  </button>
                );
              })}
            </div>
          )}
          {patientPickedName && (
            <div className="text-xs text-neutral-400">
              Selected: <span className="text-neutral-200">{patientPickedName}</span>
            </div>
          )}
        </div>

        {/* Date / Time */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
            />
          </div>
        </div>

        {/* Doctor / Room */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Doctor</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
            >
              <option value="">Select doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Room</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
            >
              <option value="">Select room…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.code ? ` (${r.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!formValid}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create appointment
          </button>
        </div>
      </form>
    </section>
  );
}