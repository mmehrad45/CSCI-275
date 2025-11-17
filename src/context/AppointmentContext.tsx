"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Appointment as AppointmentType } from "@/lib/appointments";

type AppointmentInput = Omit<AppointmentType, "id">;

type AppointmentContextType = {
  appointments: AppointmentType[];
  loading: boolean;
  error: string | null;
  addAppointment: (input: AppointmentInput) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;
};

const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined,
);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/appointments");
        if (!res.ok) throw new Error("Failed to load appointments");
        const data = (await res.json()) as AppointmentType[];
        if (!cancelled) {
          setAppointments(data);
          setError(null);
        }
      } catch (err) {
        console.error("Error loading appointments:", err);
        if (!cancelled) {
          setError("Could not load appointments from server.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addAppointment(input: AppointmentInput) {
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        console.error("Failed to create appointment:", await res.text());
        return;
      }
      const created = (await res.json()) as AppointmentType;
      setAppointments((prev) => [...prev, created]);
    } catch (err) {
      console.error("Error creating appointment:", err);
    }
  }

  async function removeAppointment(id: string) {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Failed to delete appointment:", await res.text());
        return;
      }
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting appointment:", err);
    }
  }

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        loading,
        error,
        addAppointment,
        removeAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments(): AppointmentContextType {
  const ctx = useContext(AppointmentContext);
  if (!ctx) {
    throw new Error(
      "useAppointments must be used within <AppointmentProvider>",
    );
  }
  return ctx;
}