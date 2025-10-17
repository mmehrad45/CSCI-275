// src/lib/api.ts
import { readJSON, writeJSON } from "@/lib/storage";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const AUTH_KEY = "clinicflow_auth";

// ------------------ Types ------------------
type User = { id: number; email: string; full_name: string; role: "admin" | "staff" };
export type Session = { token: string; user: User; loggedInAt: number } | null;

// ------------------ Auth helpers ------------------
function getSession(): Session {
  return readJSON<Session>(AUTH_KEY, null);
}

export function setSession(s: Session) {
  writeJSON(AUTH_KEY, s);
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

export function authHeader(): Record<string, string> | {} {
  const s = getSession();
  return s?.token ? { Authorization: `Bearer ${s.token}` } : {};
}

// ------------------ HTTP Wrapper ------------------
async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...((init.headers as Record<string, string>) || {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || "Request failed");
  return data as T;
}

// Small helper to build a query string (generic helps TS stop whining)
function qs<T extends Record<string, any>>(params?: T) {
  if (!params) return "";
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}

// ------------------ API calls ------------------
export async function apiLogin(email: string, password: string) {
  const data = await http<{ token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSession({ token: data.token, user: data.user, loggedInAt: Date.now() });
  return data;
}

export function apiLogout() {
  clearSession();
}

// ------------------ Patients ------------------
export type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  dob: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export async function apiGetPatients() {
  return http<Patient[]>("/patients", { headers: { ...(authHeader() || {}) } });
}

export async function apiAddPatient(patient: {
  firstName: string;
  lastName: string;
  dob?: string;
  phone?: string;
  email?: string;
  notes?: string;
}) {
  const body = {
    first_name: patient.firstName,
    last_name: patient.lastName,
    dob: patient.dob || null,
    phone: patient.phone || null,
    email: patient.email || null,
    notes: patient.notes || null,
  };
  return http<{ id: number }>("/patients", {
    method: "POST",
    headers: { ...(authHeader() || {}) },
    body: JSON.stringify(body),
  });
}

// ------------------ Appointments ------------------
export type Appointment = {
  id: number;
  patient_id: number;
  provider_name: string;
  start_time: string; // ISO
  end_time: string;   // ISO
  status: "scheduled" | "checked-in" | "completed" | "canceled" | "no-show";
  reason?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type AppointmentsListResponse = {
  ok: boolean;
  items: Appointment[];
  total: number;
  page: number;
  pages: number;
};

export async function apiListAppointments(filters?: {
  provider?: string;
  status?: string;
  from?: string; // ISO "YYYY-MM-DDTHH:mm:ss"
  to?: string;   // ISO
  patient_id?: number;
  page?: number;
  limit?: number;
}) {
  return http<AppointmentsListResponse>(
    `/appointments${qs(filters)}`,
    { headers: { ...(authHeader() || {}) } }
  );
}

export async function apiCreateAppointment(payload: {
  patient_id: number | string; // ✅ accept either
  provider_name: string;
  start_time: string;
  end_time: string;
  status?: Appointment["status"];
  reason?: string;
  notes?: string;
}) {

  return http<{ ok: boolean; data: Appointment }>(
    "/appointments",
    {
      method: "POST",
      headers: { ...(authHeader() || {}) },
      body: JSON.stringify(payload),
    }
  );
}
