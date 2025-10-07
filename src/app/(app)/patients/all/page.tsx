"use client";

import { useMemo, useState } from "react";
import { usePatients, Patient } from "@/context/PatientContext";
import TextInput from "@/components/TextInput";

// ---- formatting for display only ----
const formatPHN = (d: string) => {
  const x = d.slice(0, 10);
  if (!x) return "";
  const parts: string[] = [x.slice(0, 1)];
  if (x.length > 1) parts.push(x.slice(1, Math.min(4, x.length)));
  if (x.length > 4) parts.push(x.slice(4, Math.min(7, x.length)));
  if (x.length > 7) parts.push(x.slice(7, Math.min(10, x.length)));
  return parts.filter(Boolean).join(" ");
};
const formatPhone = (d: string) => {
  const x = d.slice(0, 10);
  if (!x) return "";
  if (x.length < 4) return `(${x}`;
  if (x.length < 7) return `(${x.slice(0, 3)}) ${x.slice(3)}`;
  return `(${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}`;
};

// ---- sorting helpers ----
type SortKey = "lastAsc" | "lastDesc" | "newest" | "oldest";

function compare(a: Patient, b: Patient, key: SortKey): number {
  switch (key) {
    case "lastAsc":
      return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
    case "lastDesc":
      return b.lastName.localeCompare(a.lastName) || b.firstName.localeCompare(a.firstName);
    case "newest":
      return b.createdAt - a.createdAt; // ✅ createdAt is number
    case "oldest":
      return a.createdAt - b.createdAt;
  }
}

export default function AllPatientsPage() {
  const { patients } = usePatients();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("lastAsc");

  const filteredSorted = useMemo(() => {
    const query = q.trim().toLowerCase();

    const filtered = !query
      ? patients
      : patients.filter((p) => {
          const hay = [
            p.firstName,
            p.lastName,
            p.dob,
            p.healthNumber || "",
            p.phone || "",
            p.notes || "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(query);
        });

    return [...filtered].sort((a, b) => compare(a, b, sort));
  }, [patients, q, sort]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Scrollable container with sticky header */}
      <div className="max-h-[70vh] overflow-y-auto rounded-2xl">
        {/* Sticky controls bar */}
        <div className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/95 px-6 py-4 backdrop-blur
                        dark:border-neutral-800/80 dark:bg-neutral-900/90">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">All Patients</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filteredSorted.length} {filteredSorted.length === 1 ? "result" : "results"}
              </p>
            </div>

            <div className="flex w-full max-w-xl items-end gap-3">
              <div className="w-full">
                <TextInput
                  label="Search"
                  placeholder="Name, DOB, phone, notes…"
                  value={q}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.currentTarget.value)}
                />
              </div>

              <div className="min-w-[12rem]">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Sort by
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.currentTarget.value as SortKey)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                             dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="lastAsc">Last name A → Z</option>
                  <option value="lastDesc">Last name Z → A</option>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
          {filteredSorted.map((p) => (
            <li key={p.id} className="bg-white p-6 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {p.lastName}, {p.firstName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">DOB: {p.dob}</p>
                  {p.healthNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      HN: {formatPHN(p.healthNumber)}
                    </p>
                  )}
                  {p.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Phone: {formatPhone(p.phone)}
                    </p>
                  )}
                  {p.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Notes: {p.notes}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(p.createdAt).toLocaleString()}
                </span>
              </div>
            </li>
          ))}

          {filteredSorted.length === 0 && (
            <li className="p-6 text-sm text-gray-600 dark:text-gray-300">No matches. Try a different search.</li>
          )}
        </ul>
      </div>
    </section>
  );
}