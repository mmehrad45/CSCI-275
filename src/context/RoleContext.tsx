"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Role = "doctor" | "receptionist" | "officeManager" | "guest";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "guest">;
  employeeId: string;
  doctorId?: string;
}

type RoleContextType = {
  user: CurrentUser | null;
  role: Role;
  doctorId?: string;
  employeeId?: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: Role) => void;
  setDoctorId: (id?: string) => void;
  setEmployeeId: (id?: string) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const STORAGE_KEY = "clinicflow_user";
const AUTH_COOKIE_NAME = "clinicflow_auth";

function setAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=86400`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [role, setRoleState] = useState<Role>("guest");
  const [doctorId, setDoctorIdState] = useState<string | undefined>(undefined);
  const [employeeId, setEmployeeIdState] = useState<string | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CurrentUser;
        setUser(parsed);
        setRoleState(parsed.role);
        setDoctorIdState(parsed.doctorId);
        setEmployeeIdState(parsed.employeeId);
      }
    } catch (err) {
      console.warn("Failed to read stored user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  function persist(nextUser: CurrentUser | null) {
    if (typeof window === "undefined") return;
    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        console.warn("Login failed:", await res.text());
        return false;
      }

      const data = (await res.json()) as CurrentUser;
      setUser(data);
      setRoleState(data.role);
      setDoctorIdState(data.doctorId);
      setEmployeeIdState(data.employeeId);
      persist(data);
      setAuthCookie();
      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  }

  function logout() {
    setUser(null);
    setRoleState("guest");
    setDoctorIdState(undefined);
    setEmployeeIdState(undefined);
    persist(null);
    clearAuthCookie();
  }

  function setRole(role: Role) {
    setRoleState(role);
    if (user && role !== "guest") {
      const updated = { ...user, role };
      setUser(updated);
      persist(updated);
    }
  }

  function setDoctorId(id?: string) {
    setDoctorIdState(id);
    if (user) {
      const updated = { ...user, doctorId: id };
      setUser(updated);
      persist(updated);
    }
  }

  function setEmployeeId(id?: string) {
    setEmployeeIdState(id);
    if (user && id) {
      const updated = { ...user, employeeId: id };
      setUser(updated);
      persist(updated);
    }
  }

  return (
    <RoleContext.Provider
      value={{
        user,
        role,
        doctorId,
        employeeId,
        loading,
        login,
        logout,
        setRole,
        setDoctorId,
        setEmployeeId,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextType {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within <RoleProvider>");
  }
  return ctx;
}