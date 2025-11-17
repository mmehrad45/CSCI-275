"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { readJSON, writeJSON } from "@/lib/storage";
import { useRouter } from "next/navigation";

const AUTH_KEY = "clinicflow_auth"; // storage key

type Session = { username: string; loggedInAt: number } | null;

interface AuthContextType {
  isAuthed: boolean;
  user: { username: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const router = useRouter();

  useEffect(() => {
    setSession(readJSON<Session>(AUTH_KEY, null));
  }, []);

  async function login(username: string, password: string) {
    const ok = username.trim() !== "" && password.trim() !== "";
    if (ok) {
      const s: Session = { username, loggedInAt: Date.now() };
      writeJSON(AUTH_KEY, s);
      setSession(s);
      router.push("/");
    }
    return ok;
  }

  function logout() {
    writeJSON(AUTH_KEY, null as unknown as Session);
    setSession(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{ isAuthed: !!session, user: session ? { username: session.username } : null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}