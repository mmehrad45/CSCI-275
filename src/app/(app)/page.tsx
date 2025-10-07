"use client";

export default function HomePage() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm
                    dark:border-neutral-800 dark:bg-neutral-900">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Welcome Back!
      </h1>
      <p className="text-gray-700 dark:text-gray-300">
        Use the sidebar to navigate through ClinicFlow.
      </p>
    </div>
  );
}