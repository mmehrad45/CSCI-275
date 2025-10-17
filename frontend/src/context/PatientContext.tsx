"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { readJSON, writeJSON } from "@/lib/storage";

// ---------- Types ----------
export type Patient = {
  id: string;             // uuid string
  firstName: string;
  lastName: string;
  dob: string;            // yyyy-mm-dd
  healthNumber?: string;  // digits only (up to 10, starts with 9 for BC)
  phone?: string;         // digits only (10)
  notes?: string;
  createdAt: number;      // ✅ unix ms timestamp (number)
};

type NewPatient = Omit<Patient, "id" | "createdAt">;

type PatientContextType = {
  patients: Patient[];
  addPatient: (p: NewPatient) => void;
  clearAll: () => void;
};

// ---------- Storage key ----------
const KEY = "clinicflow_patients";

// ---------- Context ----------
const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);

  // Load from localStorage once
  useEffect(() => {
    const loaded = readJSON<Patient[]>(KEY, []);
    setPatients(Array.isArray(loaded) ? loaded : []);
  }, []);

  // Persist whenever patients change
  useEffect(() => {
    writeJSON(KEY, patients);
  }, [patients]);

  function addPatient(p: NewPatient) {
    const patient: Patient = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),      // ✅ ensure number
      ...p,
    };
    setPatients((prev) => [patient, ...prev]);
  }

  function clearAll() {
    setPatients([]);
  }

  const value: PatientContextType = { patients, addPatient, clearAll };
  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatients() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatients must be used within <PatientProvider>");
  return ctx;
}