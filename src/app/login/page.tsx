// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useRole(); // removed unused role/loading
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    const ok = await login(email, password).catch(() => false);
    setSubmitting(false);
    if (!ok) return setErr("Invalid email or password.");
    router.replace("/");
  };

  return (
    <section className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-100">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}