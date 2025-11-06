"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Protected Route Wrapper
 * Wrap any page in this to restrict access to logged-in users.
 * Automatically redirects to /login if unauthenticated.
 */
export default function Protected({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // if not logged in → send to login
    if (!isAuthed) router.push("/login");
  }, [isAuthed, router]);

  // optionally render nothing while redirecting
  if (!isAuthed) return null;

  return <>{children}</>;
}