// src/app/(app)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import ChatbotFloatingButton from "@/components/AssistantChat";
import { TaskProvider, useTasks } from "@/context/TaskContext";

/** Internal: tasks link that shows the red count badge (must be inside TaskProvider) */
function TasksLink({ active }: { active: boolean }) {
  const { tasks } = useTasks();
  const openCount = tasks.filter((t) => !t.completed).length;

  return (
    <Link
      href="/tasks"
      className={`ml-2 rounded-xl px-3 py-2 ${
        active ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"
      } flex items-center gap-2`}
    >
      <span>Tasks</span>
      {openCount > 0 && (
        <span className="ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
          {openCount}
        </span>
      )}
    </Link>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, logout } = useRole();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const isReceptionist = role === "receptionist";
  const isDoctor = role === "doctor";
  const isOfficeManager = role === "officeManager";

  return (
    <TaskProvider>
      <div className="flex min-h-screen bg-neutral-950 text-gray-100">
        <aside className="flex w-60 flex-col border-r border-neutral-800 bg-neutral-950/80 px-4 py-5">
          <div className="mb-6">
            <div className="text-sm font-semibold text-blue-400">ClinicFlow</div>
            <div className="mt-1 text-[0.7rem] text-neutral-400">
              Signed in as {user.name} ({role})
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 text-xs">
            <Link
              href="/"
              className={`rounded-xl px-3 py-2 ${
                pathname === "/"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Home
            </Link>

            {isReceptionist && (
              <>
                <div className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-500">
                  Patients
                </div>

                <Link
                  href="/patients"
                  className={`ml-2 rounded-xl px-3 py-2 ${
                    pathname === "/patients"
                      ? "bg-blue-600 text-white"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  View all
                </Link>

                <Link
                  href="/patients/new"
                  className={`ml-2 rounded-xl px-3 py-2 ${
                    pathname === "/patients/new"
                      ? "bg-blue-600 text-white"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  Create new
                </Link>
              </>
            )}

            {(isReceptionist || isDoctor || isOfficeManager) && (
              <>
                <div className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-500">
                  Appointments
                </div>

                <Link
                  href="/appointments/all"
                  className={`ml-2 rounded-xl px-3 py-2 ${
                    pathname.startsWith("/appointments/all")
                      ? "bg-blue-600 text-white"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  View all
                </Link>

                {isReceptionist && (
                  <Link
                    href="/appointments/new"
                    className={`ml-2 rounded-xl px-3 py-2 ${
                      pathname.startsWith("/appointments/new")
                        ? "bg-blue-600 text-white"
                        : "text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    Create new
                  </Link>
                )}
              </>
            )}

            {(isReceptionist || isDoctor || isOfficeManager) && (
              <>
                <div className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-500">
                  Tasks
                </div>

                {/* Uses TaskProvider to show live badge */}
                <TasksLink active={pathname.startsWith("/tasks")} />
              </>
            )}

            {isOfficeManager && (
              <>
                <div className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-500">
                  Management
                </div>

                <Link
                  href="/admin"
                  className={`ml-2 rounded-xl px-3 py-2 ${
                    pathname === "/admin"
                      ? "bg-blue-600 text-white"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  Admin
                </Link>

                <Link
                  href="/analytics"
                  className={`ml-2 rounded-xl px-3 py-2 ${
                    pathname === "/analytics"
                      ? "bg-blue-600 text-white"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  Analytics
                </Link>
              </>
            )}
          </nav>

          <button
            onClick={logout}
            className="mt-4 rounded-xl px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            Sign out
          </button>
        </aside>

        <main className="relative flex-1 bg-neutral-950 p-6">
          {children}
          {isReceptionist && <ChatbotFloatingButton />}
        </main>
      </div>
    </TaskProvider>
  );
}