"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatLocalRange } from "@/lib/datetime";

type Appointment = {
  id: number;
  patientName: string;
  providerName: string | null;
  startTime: string; // ISO from backend
  endTime: string;   // ISO
  reason: string | null;
  status: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function AppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [q, setQ] = useState("");

  async function load(query = "") {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || "";
      const url = query ? `${API_URL}/appointments?q=${encodeURIComponent(query)}` : `${API_URL}/appointments`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load appointments");
      setRows(data);
    } catch (e: any) {
      setError(e.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelAppt(id: number) {
    try {
      setBusyId(id);
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to cancel appointment");
      setRows(prev => prev.map(r => (r.id === id ? { ...r, status: "canceled" } : r)));
    } catch (e: any) {
      alert(e.message || "Failed to cancel appointment");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="mt-1 text-sm text-neutral-400">Times shown in {TZ}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(q)}
            placeholder="Search patient or provider…"
            className="w-full sm:w-64 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          />
          <button
            onClick={() => load(q)}
            disabled={loading}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm hover:border-neutral-600 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Search"}
          </button>
          <Link
            href="/appointments/new"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            + New
          </Link>
        </div>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
        {error && (
          <div className="border-b border-neutral-800 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="px-4 py-10 text-sm text-neutral-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-sm text-neutral-400">
            No appointments yet.
            <Link href="/appointments/new" className="ml-2 text-blue-400 underline underline-offset-4">
              Create one
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-t border-neutral-800">
              <thead className="bg-neutral-950">
                <tr className="text-left text-sm text-neutral-300">
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">When (local)</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {rows.map((a) => (
                  <tr key={a.id} className="text-sm">
                    <td className="px-4 py-3">{a.patientName}</td>
                    <td className="px-4 py-3">{formatLocalRange(a.startTime, a.endTime)}</td>
                    <td className="px-4 py-3">{a.providerName || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize",
                          a.status === "scheduled" && "bg-emerald-500/10 text-emerald-300",
                          a.status === "canceled" && "bg-red-500/10 text-red-300",
                          a.status === "completed" && "bg-blue-500/10 text-blue-300",
                          a.status === "checked-in" && "bg-amber-500/10 text-amber-300",
                          a.status === "no-show" && "bg-neutral-700/40 text-neutral-300",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.status.toLowerCase() === "scheduled" ? (
                        <button
                          onClick={() => cancelAppt(a.id)}
                          disabled={busyId === a.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
                        >
                          {busyId === a.id ? "Cancelling…" : "Cancel"}
                        </button>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
