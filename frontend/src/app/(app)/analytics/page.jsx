"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, token: ctxToken } = useAuth() || {};

  // ✅ get token from context or clinicflow_auth fallback
  const token =
    ctxToken ||
    (typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("clinicflow_auth") || "null")?.token || ""
      : "");

  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 29 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [byDoctor, setByDoctor] = useState([]);
  const [error, setError] = useState(null);

  // Gate access to managers/admins only
  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin" && user.role !== "manager") {
      router.replace("/");
    }
  }, [user, router]);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
      const url = `${base}/analytics/summary?from=${from}&to=${to}`; // ✅ no /api

      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, {
        headers,
        cache: "no-store",
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      // ✅ your analytics structure
      setKpis(data.totals ?? data.kpis ?? null);
      setByDay(Array.isArray(data.byDay) ? data.byDay : []);
      setByDoctor(Array.isArray(data.byDoctor) ? data.byDoctor : []);
    } catch (e) {
      console.error("[Analytics load error]", e);
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const revenueTotal = useMemo(
    () => (byDay || []).reduce((s, d) => s + (Number(d.revenue) || 0), 0),
    [byDay]
  );

  return (
    <div className="p-4 space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col">
          <span className="text-sm mb-1">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm mb-1">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 border rounded"
        >
          {loading ? "Loading…" : "Apply"}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
        {!token && (
          <span className="text-red-600 text-sm">No token found (login first)</span>
        )}
      </div>

      {/* KPI row */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="border rounded p-3">
          <div className="text-xs opacity-70">Total</div>
          <div className="text-2xl font-semibold">
            {kpis?.total ?? kpis?.totalAppointments ?? "—"}
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs opacity-70">Completed</div>
          <div className="text-2xl font-semibold">
            {kpis?.completed ?? kpis?.completedAppointments ?? "—"}
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs opacity-70">Cancelled</div>
          <div className="text-2xl font-semibold">
            {kpis?.cancelled ?? kpis?.cancelledAppointments ?? "—"}
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs opacity-70">No-Shows</div>
          <div className="text-2xl font-semibold">
            {kpis?.noShow ?? kpis?.noShowAppointments ?? "—"}
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs opacity-70">Avg Wait (min)</div>
          <div className="text-2xl font-semibold">
            {kpis?.avgWaitMinutes ?? kpis?.avg_wait ?? "—"}
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs opacity-70">Revenue</div>
          <div className="text-2xl font-semibold">
            ${kpis?.totalRevenue ?? kpis?.revenue ?? revenueTotal ?? "—"}
          </div>
        </div>
      </div>

      {/* By Day */}
      <div className="border rounded p-3 overflow-x-auto">
        <div className="text-sm mb-2 font-medium">Appointments by Day</div>
        <table className="w-full text-sm min-w-[720px]">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="py-2 pr-3 text-left">Day</th>
              <th className="py-2 pr-3 text-left">Total</th>
              <th className="py-2 pr-3 text-left">Completed</th>
              <th className="py-2 pr-3 text-left">Cancelled</th>
              <th className="py-2 pr-3 text-left">No-Show</th>
              <th className="py-2 pr-3 text-left">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {byDay.map((d) => (
              <tr key={d.day} className="border-b last:border-none">
                <td className="py-2 pr-3">{d.day}</td>
                <td className="py-2 pr-3">{d.total}</td>
                <td className="py-2 pr-3">{d.completed}</td>
                <td className="py-2 pr-3">{d.cancelled}</td>
                <td className="py-2 pr-3">{d.no_show}</td>
                <td className="py-2 pr-3">${d.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* By Doctor */}
      <div className="border rounded p-3 overflow-x-auto">
        <div className="text-sm mb-2 font-medium">Appointments by Doctor</div>
        <table className="w-full text-sm min-w-[720px]">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="py-2 pr-3 text-left">Doctor</th>
              <th className="py-2 pr-3 text-left">Total</th>
              <th className="py-2 pr-3 text-left">Completed</th>
              <th className="py-2 pr-3 text-left">Cancelled</th>
              <th className="py-2 pr-3 text-left">No-Show</th>
              <th className="py-2 pr-3 text-left">Avg Wait (min)</th>
            </tr>
          </thead>
          <tbody>
            {byDoctor.map((r) => (
              <tr key={r.doctorId ?? r.doctorName} className="border-b last:border-none">
                <td className="py-2 pr-3">{r.doctorName}</td>
                <td className="py-2 pr-3">{r.total}</td>
                <td className="py-2 pr-3">{r.completed}</td>
                <td className="py-2 pr-3">{r.cancelled}</td>
                <td className="py-2 pr-3">{r.no_show}</td>
                <td className="py-2 pr-3">{r.avgWaitMinutes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
