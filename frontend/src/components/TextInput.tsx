"use client";
import { InputHTMLAttributes, useId } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string; // ← NEW: show an error under the input
}

export default function TextInput({ label, id, className = "", error, ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const base =
    "w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const light = "border-gray-300 bg-white text-gray-900 placeholder-gray-400";
  const dark = "dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-400";
  const errored =
    "border-red-500 focus:ring-red-500 dark:border-red-500"; // highlight when error

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
      </label>

      <input
        id={inputId}
        aria-invalid={!!error}
        {...rest}
        className={[
          base,
          light,
          dark,
          error ? errored : "",
          className,
        ].join(" ")}
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}