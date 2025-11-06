"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAppointmentPage() {
  const [patientName, setPatientName] = useState("");
  const [providerName, setProviderName] = useState("General");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
  const toISO = (d: string, t: string) => `${d}T${t}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientName,
          providerName,
          startISO: toISO(date, start),
          endISO: toISO(date, end),
          reason,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to book appointment");
      router.push("/appointments"); // redirect back to list
    } catch (err: any) {
      setMsg(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Book Appointment</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Patient Name</label>
          <input
            className="w-full border rounded p-2"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Provider</label>
          <input
            className="w-full border rounded p-2"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block mb-1 font-medium">Date</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Start</label>
            <input
              type="time"
              className="w-full border rounded p-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">End</label>
            <input
              type="time"
              className="w-full border rounded p-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium">Reason (optional)</label>
          <input
            className="w-full border rounded p-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Notes (optional)</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            {loading ? "Booking…" : "Book"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/appointments")}
            className="px-4 py-2 rounded border"
          >
            Cancel
          </button>
        </div>

        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
      </form>
    </div>
  );
}
