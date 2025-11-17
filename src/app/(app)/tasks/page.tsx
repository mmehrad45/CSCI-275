// src/app/(app)/tasks/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useTasks } from "@/context/TaskContext";
import { useRole } from "@/context/RoleContext";

export default function TasksPage() {
  const { tasks, loading, error, createTask, completeTask } = useTasks();
  const { role } = useRole();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [forType, setForType] = useState<"reception" | "doctor">("reception");
  const [notes, setNotes] = useState("");
  const [patientId, setPatientId] = useState("");

  const canCreate = role === "officeManager" || role === "doctor";
  const canComplete = role === "receptionist" || role === "doctor";

  const openCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);

  const onCreate = async () => {
    await createTask({
      title,
      description: desc,
      forType,
      dueDate: new Date(due),
      notes: notes || undefined,
      patientId: patientId || undefined,
    });
    setTitle("");
    setDesc("");
    setNotes("");
    setPatientId("");
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-100">
          Tasks
          <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            {openCount}
          </span>
        </h1>
      </header>

      {loading && <p className="text-sm text-neutral-300">Loading…</p>}
      {error && (
        <p className="rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {canCreate && (
        <div className="space-y-3 rounded-2xl border border-neutral-800 p-4">
          <h2 className="text-sm font-semibold text-neutral-200">Create task</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-neutral-400">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-400">For</label>
              <select
                value={forType}
                onChange={(e) => setForType(e.target.value as "reception" | "doctor")}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              >
                <option value="reception">Reception</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-neutral-400">Description</label>
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-400">Due date</label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-400">Patient ID (optional)</label>
              <input
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-neutral-400">Notes (optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Add task
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">For</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Assigned by</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-t border-neutral-800">
                <td className="px-3 py-2">
                  <div className="font-medium text-neutral-100">{t.title}</div>
                  <div className="text-xs text-neutral-400">{t.description}</div>
                  {t.notes && (
                    <div className="text-xs text-neutral-500">Notes: {t.notes}</div>
                  )}
                </td>
                <td className="px-3 py-2 capitalize">{t.forType}</td>
                <td className="px-3 py-2">
                  {new Date(t.dueDate).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  {t.createdBy || "—"}{t.createdByRole ? ` (${t.createdByRole})` : ""}
                </td>
                <td className="px-3 py-2">
                  {t.completed ? "Completed" : "Open"}
                </td>
                <td className="px-3 py-2">
                  {canComplete && !t.completed ? (
                    <button
                      onClick={() => completeTask(t.id)}
                      className="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
                    >
                      Mark complete
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-500">—</span>
                  )}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-sm text-neutral-400">
                  No tasks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}