// src/app/(app)/analytics/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRole } from "@/context/RoleContext";

/** ---- API types (match /api/analytics) ---- */
type AnalyticsResponse = {
  range: { start: string; end: string };
  timely: {
    totalPerDay: Record<string, number>;
    cancelledPerDay: Record<string, number>;
    perRoom: Record<string, number>;
    totalCancelled: number;
    totalRescheduled: number;
  };
  staff: {
    doctors: { doctorId: string; total: number; cancelled: number }[];
    appointmentsCreatedByReception: Record<string, number>;
    tasks: {
      createdByDoctor: Record<string, number>;
      createdByReception: Record<string, number>;
      completedByDoctor: Record<string, number>;
      completedByReception: Record<string, number>;
    };
  };
};

const toISO = (d: Date) => d.toISOString().slice(0, 10);

/** ---------- Tiny SVG charts (no extra deps) ---------- */
function BarChart({
  data,
  height = 160,
  barGap = 8,
  padding = 24,
}: {
  data: { label: string; value: number }[];
  height?: number;
  barGap?: number;
  padding?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = Math.max(240, data.length * 52);
  const innerH = height - padding * 2;
  const barW = Math.max(
    10,
    (width - padding * 2 - (data.length - 1) * barGap) / data.length
  );

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="block">
        {/* baseline */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#2c2c2c"
        />
        {data.map((d, i) => {
          const x = padding + i * (barW + barGap);
          const h = (d.value / max) * innerH;
          const y = height - padding - h;
          const key = `${d.label ?? ""}-${i}`; // ensure uniqueness
          return (
            <g key={key}>
              <rect x={x} y={y} width={barW} height={h} fill="#2563eb" />
              <text
                x={x + barW / 2}
                y={height - padding + 12}
                textAnchor="middle"
                fontSize="10"
                fill="#a3a3a3"
              >
                {d.label}
              </text>
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="10"
                fill="#d4d4d4"
              >
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DualLineChart({
  labels,
  a,
  b,
  height = 160,
  padding = 24,
  labelA = "Total",
  labelB = "Cancelled",
}: {
  labels: string[];
  a: number[];
  b: number[];
  height?: number;
  padding?: number;
  labelA?: string;
  labelB?: string;
}) {
  const width = Math.max(280, labels.length * 56);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const max = Math.max(1, ...a, ...b);
  const x = (i: number) => padding + (i / Math.max(1, labels.length - 1)) * innerW;
  const y = (v: number) => padding + (1 - v / max) * innerH;
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="block">
        {/* axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#2c2c2c"
        />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#2c2c2c" />
        {/* lines */}
        <path d={path(a)} fill="none" stroke="#60a5fa" strokeWidth={2} />
        <path d={path(b)} fill="none" stroke="#f87171" strokeWidth={2} />
        {/* x labels */}
        {labels.map((lb, i) => (
          <text
            key={lb + i}
            x={x(i)}
            y={height - padding + 12}
            textAnchor="middle"
            fontSize="10"
            fill="#a3a3a3"
          >
            {lb}
          </text>
        ))}
        {/* legend */}
        <rect x={width - 160} y={8} width={152} height={18} rx={6} fill="#0a0a0a" stroke="#222" />
        <circle cx={width - 146} cy={17} r={4} fill="#60a5fa" />
        <text x={width - 136} y={20} fontSize="10" fill="#d4d4d4">
          {labelA}
        </text>
        <circle cx={width - 76} cy={17} r={4} fill="#f87171" />
        <text x={width - 66} y={20} fontSize="10" fill="#d4d4d4">
          {labelB}
        </text>
      </svg>
    </div>
  );
}

/** ------------------------------------------------------ */

export default function AnalyticsPage() {
  const { role } = useRole();
  const isManager = role === "officeManager";

  const [tab, setTab] = useState<"timely" | "staff" | "compare">("timely");
  const [start, setStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toISO(d);
  });
  const [end, setEnd] = useState<string>(() => toISO(new Date()));

  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // staff filters
  const [doctorFilter, setDoctorFilter] = useState<string>("__all__");
  const [receptionFilter, setReceptionFilter] = useState<string>("__all__");
  const [receptionApptFilter, setReceptionApptFilter] = useState<string>("__all__");

  // comparison mode
  const [compareMode, setCompareMode] = useState<"doctor" | "receptionist">("doctor");
  const [compareMetric, setCompareMetric] = useState<
    | "doctor_appts"
    | "doctor_cancelled"
    | "doctor_tasks_created"
    | "doctor_tasks_completed"
    | "reception_appts_created"
    | "reception_tasks_created"
    | "reception_tasks_completed"
  >("doctor_appts");
  const [leftEntity, setLeftEntity] = useState<string>("");
  const [rightEntity, setRightEntity] = useState<string>("");

  // --- derived lists / rows ---
  const days = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.timely.totalPerDay).sort();
  }, [data]);

  const totalsSeries = useMemo(() => days.map((d) => data!.timely.totalPerDay[d] || 0), [days, data]);
  const cancelledSeries = useMemo(
    () => days.map((d) => data!.timely.cancelledPerDay[d] || 0),
    [days, data]
  );

  const doctorNames = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.staff.doctors.map((d) => d.doctorId))).sort();
  }, [data]);

  const receptionistNames = useMemo(() => {
    if (!data) return [];
    const keys = new Set<string>([
      ...Object.keys(data.staff.appointmentsCreatedByReception || {}),
      ...Object.keys(data.staff.tasks.createdByReception || {}),
      ...Object.keys(data.staff.tasks.completedByReception || {}),
    ]);
    return Array.from(keys).sort();
  }, [data]);

  const doctorApptRows = useMemo(() => {
    if (!data) return [];
    const items = data.staff.doctors.filter(
      (d) => doctorFilter === "__all__" || d.doctorId === doctorFilter
    );
    return items.map((d) => ({
      label: d.doctorId,
      value: d.total,
      aux: `${d.cancelled} cancelled`,
    }));
  }, [data, doctorFilter]);

  const tasksCreatedByDoctorRows = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.staff.tasks.createdByDoctor);
    const filtered =
      doctorFilter === "__all__" ? entries : entries.filter(([name]) => name === doctorFilter);
    return filtered.map(([name, count]) => ({ label: name, value: count }));
  }, [data, doctorFilter]);

  const tasksCompletedByDoctorRows = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.staff.tasks.completedByDoctor);
    const filtered =
      doctorFilter === "__all__" ? entries : entries.filter(([name]) => name === doctorFilter);
    return filtered.map(([name, count]) => ({ label: name, value: count }));
  }, [data, doctorFilter]);

  const tasksCreatedByReceptionRows = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.staff.tasks.createdByReception || {});
    const filtered =
      receptionFilter === "__all__" ? entries : entries.filter(([n]) => n === receptionFilter);
    return filtered.map(([name, count]) => ({ label: name, value: count }));
  }, [data, receptionFilter]);

  const tasksCompletedByReceptionRows = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.staff.tasks.completedByReception || {});
    const filtered =
      receptionFilter === "__all__" ? entries : entries.filter(([n]) => n === receptionFilter);
    return filtered.map(([name, count]) => ({ label: name, value: count }));
  }, [data, receptionFilter]);

  const apptCreatedByReceptionRows = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.staff.appointmentsCreatedByReception || {});
    const filtered =
      receptionApptFilter === "__all__"
        ? entries
        : entries.filter(([n]) => n === receptionApptFilter);
    return filtered.map(([name, count]) => ({ label: name, value: count }));
  }, [data, receptionApptFilter]);

  // comparison computed numbers
  const compareLeftRight = useMemo(() => {
    if (!data || !leftEntity || !rightEntity) return { left: 0, right: 0, metricLabel: "" };
    const S = data.staff;

    const get = (m: typeof compareMetric, who: string) => {
      switch (m) {
        case "doctor_appts": {
          const d = S.doctors.find((x) => x.doctorId === who);
          return d ? d.total : 0;
        }
        case "doctor_cancelled": {
          const d = S.doctors.find((x) => x.doctorId === who);
          return d ? d.cancelled : 0;
        }
        case "doctor_tasks_created":
          return S.tasks.createdByDoctor[who] || 0;
        case "doctor_tasks_completed":
          return S.tasks.completedByDoctor[who] || 0;
        case "reception_appts_created":
          return S.appointmentsCreatedByReception[who] || 0;
        case "reception_tasks_created":
          return S.tasks.createdByReception[who] || 0;
        case "reception_tasks_completed":
          return S.tasks.completedByReception[who] || 0;
        default:
          return 0;
      }
    };

    const metricLabelMap: Record<typeof compareMetric, string> = {
      doctor_appts: "Appointments",
      doctor_cancelled: "Cancelled appts",
      doctor_tasks_created: "Tasks created",
      doctor_tasks_completed: "Tasks completed",
      reception_appts_created: "Appts created",
      reception_tasks_created: "Tasks created",
      reception_tasks_completed: "Tasks completed",
    };

    return {
      left: get(compareMetric, leftEntity),
      right: get(compareMetric, rightEntity),
      metricLabel: metricLabelMap[compareMetric],
    };
  }, [data, leftEntity, rightEntity, compareMetric]);

  // fetching
  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    setData(null);
    const q = new URLSearchParams({ start, end }).toString();
    const res = await fetch(`/api/analytics?${q}`, { cache: "no-store" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Failed to load analytics");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as AnalyticsResponse;
    setData(json);
    // reset compare selections when fresh data arrives
    setLeftEntity("");
    setRightEntity("");
    setLoading(false);
  };

  useEffect(() => {
    if (isManager) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, isManager]);

  if (!isManager) {
    return <div className="text-sm text-neutral-300">You don&apos;t have access to Analytics.</div>;
  }

  return (
    <section className="space-y-4">
      {/* HEADER - controls */}
      <header className="flex flex-wrap items-center justify-between gap-6">
        <h1 className="text-2xl font-semibold text-gray-100">Analytics</h1>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col space-y-1" style={{ minWidth: "160px" }}>
            <label className="text-xs text-neutral-300">Start</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="font-sans rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            />
          </div>
          <div className="flex flex-col space-y-1" style={{ minWidth: "160px" }}>
            <label className="text-xs text-neutral-300">End</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="font-sans rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            />
          </div>

          <div className="rounded-xl border border-neutral-700 p-1 text-xs flex">
            <button
              onClick={() => setTab("timely")}
              className={`rounded-lg px-3 py-2 ${
                tab === "timely" ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Timely view
            </button>
            <button
              onClick={() => setTab("staff")}
              className={`rounded-lg px-3 py-2 ${
                tab === "staff" ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Staff view
            </button>
            <button
              onClick={() => setTab("compare")}
              className={`rounded-lg px-3 py-2 ${
                tab === "compare" ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Compare
            </button>
          </div>

          <button
            onClick={fetchData}
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </header>

      {loading && <p className="text-sm text-neutral-300">Crunching numbers…</p>}
      {err && <p className="rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-300">{err}</p>}

      {/* ---------- TIMELY VIEW (charts) ---------- */}
      {!loading && !err && data && tab === "timely" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total appointments"
              value={Object.values(data.timely.totalPerDay).reduce((a, b) => a + b, 0)}
            />
            <StatCard title="Cancelled" value={data.timely.totalCancelled} />
            <StatCard title="Rescheduled" value={data.timely.totalRescheduled} />
            <StatCard title="Active days" value={days.length} />
          </div>

          <div className="rounded-2xl border border-neutral-800 p-3">
            <div className="mb-2 text-sm font-semibold text-neutral-200">Appointments over time</div>
            <DualLineChart
              labels={days}
              a={totalsSeries}
              b={cancelledSeries}
              labelA="Total"
              labelB="Cancelled"
            />
          </div>

          <div className="rounded-2xl border border-neutral-800 p-3">
            <div className="mb-2 text-sm font-semibold text-neutral-200">Appointments per room</div>
            <BarChart
              data={Object.entries(data.timely.perRoom).map(([roomId, count]) => ({
                label: roomId,
                value: count,
              }))}
            />
          </div>
        </div>
      )}

      {/* ---------- STAFF VIEW (tables) ---------- */}
      {!loading && !err && data && tab === "staff" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid gap-3 md:grid-cols-3">
            <SelectBox
              label="Filter doctor"
              value={doctorFilter}
              onChange={setDoctorFilter}
              options={["__all__", ...doctorNames]}
              labels={{ __all__: "All doctors" }}
            />
            <SelectBox
              label="Filter receptionist (tasks)"
              value={receptionFilter}
              onChange={setReceptionFilter}
              options={["__all__", ...receptionistNames]}
              labels={{ __all__: "All receptionists" }}
            />
            <SelectBox
              label="Filter receptionist (appointments)"
              value={receptionApptFilter}
              onChange={setReceptionApptFilter}
              options={["__all__", ...receptionistNames]}
              labels={{ __all__: "All receptionists" }}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Table title="Doctor appointments" rows={doctorApptRows} />
            <Table
              title="Appointments created by receptionists"
              rows={apptCreatedByReceptionRows}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Table title="Tasks created by doctors" rows={tasksCreatedByDoctorRows} />
            <Table title="Tasks completed by doctors" rows={tasksCompletedByDoctorRows} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Table title="Tasks created by receptionists" rows={tasksCreatedByReceptionRows} />
            <Table title="Tasks completed by receptionists" rows={tasksCompletedByReceptionRows} />
          </div>
        </div>
      )}

      {/* ---------- COMPARISON MODE (selectors + chart) ---------- */}
      {!loading && !err && data && tab === "compare" && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <SelectBox
              label="Compare"
              value={compareMode}
              onChange={(v) => {
                setCompareMode(v as "doctor" | "receptionist");
                setLeftEntity("");
                setRightEntity("");
                setCompareMetric(
                  v === "doctor" ? "doctor_appts" : "reception_appts_created"
                );
              }}
              options={["doctor", "receptionist"]}
              labels={{ doctor: "Doctors", receptionist: "Receptionists" }}
            />

            <SelectBox
              label="Metric"
              value={compareMetric}
              onChange={(v) => setCompareMetric(v as typeof compareMetric)}
              options={
                compareMode === "doctor"
                  ? [
                      "doctor_appts",
                      "doctor_cancelled",
                      "doctor_tasks_created",
                      "doctor_tasks_completed",
                    ]
                  : [
                      "reception_appts_created",
                      "reception_tasks_created",
                      "reception_tasks_completed",
                    ]
              }
              labels={{
                doctor_appts: "Appointments",
                doctor_cancelled: "Cancelled appts",
                doctor_tasks_created: "Tasks created",
                doctor_tasks_completed: "Tasks completed",
                reception_appts_created: "Appts created",
                reception_tasks_created: "Tasks created",
                reception_tasks_completed: "Tasks completed",
              }}
            />

            <SelectBox
              label="Left"
              value={leftEntity}
              onChange={setLeftEntity}
              options={compareMode === "doctor" ? doctorNames : receptionistNames}
            />
            <SelectBox
              label="Right"
              value={rightEntity}
              onChange={setRightEntity}
              options={compareMode === "doctor" ? doctorNames : receptionistNames}
            />
          </div>

          <div className="rounded-2xl border border-neutral-800 p-3">
            <div className="mb-2 text-sm font-semibold text-neutral-200">
              {compareLeftRight.metricLabel}
            </div>
            <BarChart
              data={[
                { label: leftEntity || "—", value: compareLeftRight.left },
                { label: rightEntity || "—", value: compareLeftRight.right },
              ]}
            />
          </div>
        </div>
      )}
    </section>
  );
}

/** ---------- UI bits ---------- */
function SelectBox({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-neutral-300">{label}</label>
      <select
        className="font-sans w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labels?.[opt] ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-800 p-4">
      <div className="text-xs text-neutral-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-neutral-100">{value}</div>
    </div>
  );
}

function Table({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; aux?: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800">
      <div className="bg-neutral-900 px-3 py-2 text-sm font-semibold text-neutral-200">
        {title}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-3 text-neutral-400">No data</td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.label} className="border-t border-neutral-800">
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.value}</td>
                <td className="px-3 py-2 text-right text-xs text-neutral-500">
                  {r.aux || ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}