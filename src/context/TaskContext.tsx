// src/context/TaskContext.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRole } from "@/context/RoleContext";

export type TaskType = {
  id: string;
  title: string;
  description: string;
  patientId?: string;
  notes?: string;
  forType: "reception" | "doctor";
  createdBy?: string;
  createdByRole?: "officeManager" | "doctor";
  dueDate: string | Date;
  completed: boolean;
  completedByEmployeeId?: string;
  completedAt?: string | Date;
};

type Ctx = {
  tasks: TaskType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (t: {
    title: string;
    description: string;
    forType: "reception" | "doctor";
    dueDate: string | Date;
    patientId?: string;
    notes?: string;
  }) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
};

const TaskContext = createContext<Ctx | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { role, user, employeeId } = useRole();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = (await res.json()) as TaskType[];
      setTasks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createTask = useCallback<Ctx["createTask"]>(
    async (t) => {
      if (!(role === "officeManager" || role === "doctor")) {
        throw new Error("Only office managers or doctors can create tasks.");
      }
      const createdBy =
        (user?.name && String(user.name)) ||
        (user?.email && String(user.email)) ||
        "unknown";

      const payload = {
        ...t,
        createdBy,
        createdByRole: role === "officeManager" ? "officeManager" : "doctor",
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to create task");
      }
      await refresh();
    },
    [role, user?.name, user?.email, refresh]
  );

  const completeTask = useCallback<Ctx["completeTask"]>(
    async (id) => {
      if (!(role === "receptionist" || role === "doctor")) {
        throw new Error("Only receptionists or doctors can complete tasks.");
      }
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", employeeId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to complete task");
      }
      await refresh();
    },
    [role, employeeId, refresh]
  );

  const value = useMemo(
    () => ({ tasks, loading, error, refresh, createTask, completeTask }),
    [tasks, loading, error, refresh, createTask, completeTask]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within TaskProvider");
  return ctx;
}