"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function SidebarLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={[
        "block rounded-lg px-3 py-2 text-sm transition",
        active
          ? "bg-blue-600 text-white"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-800",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [openPatients, setOpenPatients] = useState(true); // start open

  return (
    <div className="grid min-h-screen grid-cols-[16rem_1fr]">
      {/* Sidebar */}
      <aside className="border-r border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 px-1">
          <div className="text-lg font-semibold">ClinicFlow</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">CSCI-275</div>
        </div>

        <nav className="space-y-1">
          <SidebarLink href="/" label="Home" />

          {/* Patients dropdown */}
          <div className="mt-4">
            <button
              onClick={() => setOpenPatients((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium
                         text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-800"
            >
              <span>Patients</span>
              <svg
                className={`h-4 w-4 transform transition-transform duration-200 ${
                  openPatients ? "rotate-90" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                openPatients ? "max-h-40" : "max-h-0"
              }`}
            >
              <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3 dark:border-neutral-700">
                <SidebarLink href="/patients/new" label="Create New" />
                <SidebarLink href="/patients/all" label="View All" />
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-gray-200 bg-white px-4 py-2
                           dark:border-neutral-800 dark:bg-neutral-900">
          <button
            onClick={logout}
            className="rounded-xl px-3 py-1 text-sm text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-neutral-800"
          >
            Logout
          </button>
        </header>

        <main className="container mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}