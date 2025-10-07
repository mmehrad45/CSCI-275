"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/Button";
import TextInput from "@/components/TextInput";
import { usePatients } from "@/context/PatientContext";
import { patientSchema, PatientFormInput } from "@/lib/validation";
import Link from "next/link";

// helpers
const digitsOnly = (s: string) => s.replace(/\D+/g, "");
const formatPHN = (d: string) => {
  const x = d.slice(0, 10);
  if (!x) return "";
  const parts: string[] = [x.slice(0, 1)];
  if (x.length > 1) parts.push(x.slice(1, Math.min(4, x.length)));
  if (x.length > 4) parts.push(x.slice(4, Math.min(7, x.length)));
  if (x.length > 7) parts.push(x.slice(7, Math.min(10, x.length)));
  return parts.filter(Boolean).join(" ");
};
const formatPhone = (d: string) => {
  const x = d.slice(0, 10);
  if (!x) return "";
  if (x.length < 4) return `(${x}`;
  if (x.length < 7) return `(${x.slice(0, 3)}) ${x.slice(3)}`;
  return `(${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}`;
};

type FieldErrors = Partial<Record<keyof PatientFormInput, string>>;

export default function NewPatientPage() {
  const { addPatient } = usePatients();

  const [form, setForm] = useState<PatientFormInput>({
    firstName: "",
    lastName: "",
    dob: "",
    healthNumber: undefined,
    phone: undefined,
    notes: undefined,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [savedOnce, setSavedOnce] = useState(false); // show CTA after first save

  function set<K extends keyof PatientFormInput>(k: K, v: PatientFormInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validateAll():
    | { ok: true; data: PatientFormInput }
    | { ok: false; errors: FieldErrors } {
    const parsed = patientSchema.safeParse(form);
    if (parsed.success) return { ok: true, data: parsed.data };
    const flat = parsed.error.flatten().fieldErrors;
    const fe: FieldErrors = {
      firstName: flat.firstName?.[0],
      lastName: flat.lastName?.[0],
      dob: flat.dob?.[0],
      healthNumber: flat.healthNumber?.[0],
      phone: flat.phone?.[0],
      notes: flat.notes?.[0],
    };
    return { ok: false, errors: fe };
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validateAll();
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    addPatient(v.data);
    setSavedOnce(true);
    setForm({
      firstName: "",
      lastName: "",
      dob: "",
      healthNumber: undefined,
      phone: undefined,
      notes: undefined,
    });
    setErrors({});
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm
                        dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create Patient</h2>
        <Link
          href="/patients/all"
          className="text-sm text-blue-700 hover:underline dark:text-blue-400"
        >
          Go to all patients →
        </Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <TextInput
          label="First name"
          value={form.firstName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("firstName", e.currentTarget.value)}
          required
          error={errors.firstName}
        />
        <TextInput
          label="Last name"
          value={form.lastName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("lastName", e.currentTarget.value)}
          required
          error={errors.lastName}
        />
        <TextInput
          label="Date of birth"
          type="date"
          value={form.dob}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("dob", e.currentTarget.value)}
          required
          error={errors.dob}
        />
        <TextInput
          label="BC Health number"
          value={form.healthNumber ? formatPHN(form.healthNumber) : ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("healthNumber", digitsOnly(e.currentTarget.value))}
          placeholder="9 123 456 789"
          inputMode="numeric"
          error={errors.healthNumber}
        />
        <TextInput
          label="Phone"
          value={form.phone ? formatPhone(form.phone) : ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("phone", digitsOnly(e.currentTarget.value))}
          placeholder="(604) 123-4567"
          inputMode="numeric"
          error={errors.phone}
        />
        <TextInput
          label="Notes"
          value={form.notes ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("notes", e.currentTarget.value)}
          error={errors.notes}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit">Save patient</Button>
          <Link
            href="/patients/all"
            className="text-sm text-blue-700 hover:underline dark:text-blue-400"
          >
            Go to all patients
          </Link>
        </div>

        {savedOnce && (
          <p className="text-sm text-green-700 dark:text-green-400">
            Patient saved. You can add another, or <Link href="/patients/all" className="underline">view all</Link>.
          </p>
        )}
      </form>
    </section>
  );
}