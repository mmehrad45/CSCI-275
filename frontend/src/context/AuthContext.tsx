"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { readJSON } from "@/lib/storage"; // only for initial load
import { apiLogin, apiLogout, setSession as saveSession, type Session } from "@/lib/api";

const AUTH_KEY = "clinicflow_auth"; // same key used in api.ts

// Put this above (or together with) AuthContextType
type BackendUser = {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "staff";
};

interface AuthContextType {
  isAuthed: boolean;
  user: BackendUser | null;   // <-- matches backend
  token: string | null;       // <-- expose token too
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session>(null);
  const router = useRouter();

  // Load any existing session from localStorage on mount
  useEffect(() => {
    const s = readJSON<Session>(AUTH_KEY, null);
    setSessionState(s);
  }, []);

  // ----- actions -----
  async function login(email: string, password: string) {
    try {
      // Calls backend /auth/login and (in api.ts) saves to localStorage
      const { token, user } = await apiLogin(email, password);
      const s: Session = { token, user, loggedInAt: Date.now() };

      // Persist and update in-memory state
      saveSession(s);
      setSessionState(s);

      router.push("/");
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  }

  function logout() {
    apiLogout();           // clears localStorage
    setSessionState(null); // clear in-memory
    router.push("/login");
  }

  // values exposed to the app
  const value: AuthContextType = {
    isAuthed: !!session?.token,
    user: session?.user ?? null,
    token: session?.token ?? null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
