// src/app/(app)/patients/new/page.tsx
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useRole } from "@/context/RoleContext";

/* -------------------- helpers -------------------- */
const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
const isValidYMD = (s: string) => {
  if (!s) return true;
  if (!ymdRegex.test(s)) return false;
  const [yStr, mStr, dStr] = s.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1900 || y > 2100) return false;
  const lastDay = new Date(y, m, 0).getDate();
  return d >= 1 && d <= lastDay;
};

const digitsOnly = (s: string) => s.replace(/\D/g, "");

// pretty formatter for 10-digit NA numbers. (progressive formatting for typing)
const formatPhonePretty = (raw: string) => {
  const d = digitsOnly(raw).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)} - ${d.slice(6, 10)}`;
};

// normalize any variation of NA to "N/A"
const isNA = (v: string) => {
  const t = v.trim().toLowerCase();
  return t === "n/a" || t === "na" || t === "n a";
};

/* -------------------- zod schema -------------------- */
const PatientSchema = z.object({
  firstName: z.string().trim().min(1, { message: "First name is required" }),
  lastName: z.string().trim().min(1, { message: "Last name is required" }),
  dateOfBirth: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .refine((v) => (v ? isValidYMD(v) : true), {
      message: "Date of birth must be a valid date (YYYY-MM-DD)",
    }),
  // phone optional; must be "N/A" (case-insensitive) or 10 digits
  phone: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .refine(
      (v) => {
        if (!v) return true;
        if (isNA(v)) return true;
        return digitsOnly(v).length === 10;
      },
      { message: 'Phone must be "N/A" or a 10-digit number' }
    ),
  // email optional
  email: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .refine((v) => (v ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : true), {
      message: "Email must be a valid email address",
    }),
  // BC style: starts with 9 and exactly 10 digits (optional)
  healthNumber: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .refine((v) => (v ? /^9\d{9}$/.test(v) : true), {
      message: "Health number must start with 9 and be exactly 10 digits",
    }),
  notes: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
});

type FormErrors = Partial<Record<keyof z.infer<typeof PatientSchema>, string>>;

/* -------------------- page -------------------- */
export default function NewPatientPage() {
  const router = useRouter();
  const { role } = useRole();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [healthNumber, setHealthNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const canCreate = role === "receptionist";

  const formData = useMemo(
    () => ({
      firstName,
      lastName,
      dateOfBirth: dateOfBirth || undefined,
      phone: phone || undefined,
      email: email || undefined,
      healthNumber: healthNumber || undefined,
      notes: notes || undefined,
    }),
    [firstName, lastName, dateOfBirth, phone, email, healthNumber, notes]
  );

  // typing handler that allows free typing, normalizes NA, and progressively formats digits
  const handlePhoneChange = (val: string) => {
    if (!val) {
      setPhone("");
      return;
    }
    if (isNA(val)) {
      setPhone("N/A"); // force uppercase
      return;
    }
    // keep only digits while typing, then pretty format progressively
    setPhone(formatPhonePretty(val));
  };

  const handlePhoneBlur = (val: string) => {
    if (!val) {
      setPhone("");
      return;
    }
    if (isNA(val)) {
      setPhone("N/A");
      return;
    }
    const d = digitsOnly(val);
    // if they typed fewer than 10 digits, keep whatever they typed (unformatted) to allow correction
    setPhone(d.length ? formatPhonePretty(d) : "");
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const parsed = PatientSchema.safeParse(formData);
    if (!parsed.success) {
      const zodErrs: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!zodErrs[key]) zodErrs[key] = issue.message;
      }
      setFieldErrors(zodErrs);
      return;
    }

    try {
      setSubmitting(true);
      // ensure phone is normalized before saving
      const payload = { ...parsed.data };
      if (payload.phone && isNA(payload.phone)) payload.phone = "N/A";
      if (payload.phone && !isNA(payload.phone)) {
        payload.phone = formatPhonePretty(payload.phone);
      }

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create patient");
      }

      router.push("/patients");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create patient.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Create patient
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Add a new patient to the database.
        </p>
      </header>

      {!canCreate && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Only receptionists can create patient records.
        </p>
      )}

      {canCreate && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          {submitError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {submitError}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                First name
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.firstName
                    ? "border-red-400 dark:border-red-600"
                    : "border-gray-300 dark:border-neutral-700"
                } bg-white text-gray-900 dark:bg-neutral-800 dark:text-neutral-100`}
                required
              />
              {fieldErrors.firstName && (
                <p className="text-[0.7rem] text-red-500">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Last name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.lastName
                    ? "border-red-400 dark:border-red-600"
                    : "border-gray-300 dark:border-neutral-700"
                } bg-white text-gray-900 dark:bg-neutral-800 dark:text-neutral-100`}
                required
              />
              {fieldErrors.lastName && (
                <p className="text-[0.7rem] text-red-500">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Date of birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.dateOfBirth
                    ? "border-red-400 dark:border-red-600"
                    : "border-gray-300 dark:border-neutral-700"
                } bg-white text-gray-900 dark:bg-neutral-800 dark:text-neutral-100`}
                placeholder="YYYY-MM-DD"
              />
              {fieldErrors.dateOfBirth && (
                <p className="text-[0.7rem] text-red-500">
                  {fieldErrors.dateOfBirth}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={(e) => handlePhoneBlur(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.phone
                    ? "border-red-400 dark:border-red-600"
                    : "border-gray-300 dark:border-neutral-700"
                } bg-white text-gray-900 dark:bg-neutral-800 dark:text-neutral-100`}
                placeholder=""
              />
              <p className="text-[0.7rem] text-gray-500 dark:text-gray-400">
                If not available, input N/A.
              </p>
              {fieldErrors.phone && (
                <p className="text-[0.7rem] text-red-500">
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.email
                    ? "border-red-400 dark:border-red-600"
                    : "border-gray-300 dark:border-neutral-700"
                } bg-white text-gray-900 dark:bg-neutral-800 dark:text-neutral-100`}
                placeholder="name@example.com"
              />
              {fieldErrors.email && (
                <p className="text-[0.7rem] text-red-500">
                  {fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Health number
            </label>
            <input
              value={healthNumber}
              onChange={(e) => setHealthNumber(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.healthNumber
                  ? "border-red-400 dark:border-red-600"
                  : "border-gray-300 dark:border-neutral-700"
              } bg-white text-gray-900 dark:bg-neutral-800 dark:text-neutral-100`}
              placeholder="Must start with 9 and be 10 digits"
            />
            {fieldErrors.healthNumber && (
              <p className="text-[0.7rem] text-red-500">
                {fieldErrors.healthNumber}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.notes
                  ? "border-red-400 dark:border-red-600"
                  : "border-gray-300 dark:border-neutral-700"
              } bg-white text-gray-900 dark:bg-neutral-800 dark:text-neutral-100`}
            />
            {fieldErrors.notes && (
              <p className="text-[0.7rem] text-red-500">
                {fieldErrors.notes}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/patients")}
              className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {submitting ? "Saving…" : "Save patient"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}