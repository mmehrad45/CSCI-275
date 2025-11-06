"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import TextInput from "@/components/TextInput";
import Button from "@/components/Button";

const BG = "/images/bg-clinic.jpg";
const LOGO = "/images/clinicflow-logo.jpg";

export default function LoginPage() {
  const { login, isAuthed } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect to home if already logged in
  useEffect(() => {
    if (isAuthed) router.push("/");
  }, [isAuthed, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const ok = await login(email, password); // ← email, not username
    setLoading(false);
    if (!ok) setError("Invalid email or password.");
  }

  return (
    <div
      className="relative min-h-[calc(100vh-56px)] transition-colors duration-300"
      style={{
        backgroundImage: `url('${BG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />

      <div className="relative z-10 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-neutral-900/90 p-8 shadow-xl backdrop-blur-md">
          <div className="mb-6 flex flex-col items-center gap-3">
            <img
              src={LOGO}
              alt="ClinicFlow logo"
              width={72}
              height={72}
              style={{ width: 72, height: 72, objectFit: "contain" }}
              className="drop-shadow-sm rounded"
            />
            <h1 className="text-2xl font-semibold tracking-tight text-center text-gray-900 dark:text-gray-100">
              Welcome to ClinicFlow
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
              Sign in to continue
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 mt-4">
            <TextInput
              label="Email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.currentTarget.value)
              }
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="placeholder-gray-400 dark:placeholder-gray-400"
            />

            <TextInput
              label="Password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.currentTarget.value)
              }
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="placeholder-gray-400 dark:placeholder-gray-400"
            />

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            By continuing, you agree to our{" "}
            <a className="underline hover:text-blue-600 dark:hover:text-blue-400" href="#">
              Terms
            </a>{" "}
            and{" "}
            <a className="underline hover:text-blue-600 dark:hover:text-blue-400" href="#">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
