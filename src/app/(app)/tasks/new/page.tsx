// src/app/(app)/tasks/new/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";

type TaskForType = "reception" | "doctor";

export default function NewTaskPage() {
  const router = useRouter();
  const { role, user } = useRole();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [forType, setForType] = useState<TaskForType>("reception");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = role === "doctor" || role === "officeManager";

  if (!canCreate) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Create task
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Only doctors and office managers can create tasks.
        </p>
      </section>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    if (!title.trim() || !description.trim() || !dueDate) {
      setError("Title, description and due date are required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          forType,
          dueDate,
          notes: notes || undefined,
          createdByUserId: user.id,
          createdByName: user.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          (data && (data.error as string)) || "Failed to create task";
        throw new Error(message);
      }

      router.push("/tasks");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create task.";
      console.error("Create task failed:", err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Create task
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Add a new task for reception or doctors.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              For
            </label>
            <select
              value={forType}
              onChange={(e) =>
                setForType(e.target.value as TaskForType)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="reception">Reception</option>
              <option value="doctor">Doctors</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Deadline
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/tasks")}
            className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            {submitting ? "Creating…" : "Create task"}
          </button>
        </div>
      </form>
    </section>
  );
}