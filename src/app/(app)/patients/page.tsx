// src/app/patients/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/context/RoleContext";

type Patient = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  healthNumber?: string;
  notes?: string;
};

export default function PatientsPage() {
  const { role } = useRole();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      try {
        setLoading(true);
        const res = await fetch("/api/patients");
        if (!res.ok) return;
        const raw = (await res.json()) as Patient[];

        // Normalize so UI always has displayable values
        const data = raw.map((p) => {
          const full =
            p.fullName && p.fullName.trim().length > 0
              ? p.fullName.trim()
              : [p.firstName, p.lastName].filter(Boolean).join(" ").trim();

          return {
            ...p,
            fullName: full || "(no name)",
            phone: (p.phone ?? "").trim(),
            email: (p.email ?? "").trim(),
            healthNumber: (p.healthNumber ?? "").trim(),
            notes: (p.notes ?? "").trim(),
          };
        });

        if (!cancelled) setPatients(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPatients();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Patients
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Live list of patients stored in MongoDB.
          </p>
        </div>
        {role === "receptionist" && (
          <a
            href="/patients/new"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Create new patient
          </a>
        )}
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {loading ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Loading patients…
          </p>
        ) : patients.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No patients found yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-gray-200 text-[0.7rem] uppercase tracking-wide text-gray-500 dark:border-neutral-800 dark:text-gray-400">
                <tr>
                  <th className="px-2 py-1.5">Name</th>
                  <th className="px-2 py-1.5">Phone</th>
                  <th className="px-2 py-1.5">Email</th>
                  <th className="px-2 py-1.5">Health #</th>
                  <th className="px-2 py-1.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {patients.map((p) => (
                  <tr key={p.id} className="align-middle text-[0.75rem]">
                    <td className="px-2 py-1.5 font-medium text-gray-900 dark:text-gray-50">
                      {p.fullName}
                    </td>
                    <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                      {p.phone && p.phone.length > 0 ? p.phone : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                      {p.email && p.email.length > 0 ? p.email : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                      {p.healthNumber && p.healthNumber.length > 0 ? p.healthNumber : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">
                      {p.notes && p.notes.length > 0 ? (p.notes.length > 60 ? `${p.notes.slice(0, 60)}…` : p.notes) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}