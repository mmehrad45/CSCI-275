"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  healthNumber?: string;
  dateOfBirth?: string;
};

type PatientInput = Omit<Patient, "id">;

type PatientContextType = {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  addPatient: (input: PatientInput) => Promise<void>;
};

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/patients");
        if (!res.ok) throw new Error("Failed to load patients");
        const data = (await res.json()) as Patient[];
        if (!cancelled) {
          setPatients(data);
          setError(null);
        }
      } catch (err) {
        console.error("Error loading patients:", err);
        if (!cancelled) {
          setError("Could not load patients from server.");
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

  async function addPatient(input: PatientInput) {
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        console.error("Failed to create patient:", await res.text());
        return;
      }
      const created = (await res.json()) as Patient;
      setPatients((prev) => [...prev, created]);
    } catch (err) {
      console.error("Error creating patient:", err);
    }
  }

  return (
    <PatientContext.Provider
      value={{
        patients,
        loading,
        error,
        addPatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients(): PatientContextType {
  const ctx = useContext(PatientContext);
  if (!ctx) {
    throw new Error("usePatients must be used within <PatientProvider>");
  }
  return ctx;
}