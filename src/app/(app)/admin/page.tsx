// src/app/admin/page.tsx

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRole } from "@/context/RoleContext";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: "doctor" | "receptionist" | "officeManager";
  employeeId: string;
  doctorId?: string;
};

type Doctor = {
  id: string;
  name: string;
  email: string;
};

type Room = {
  id: string;
  name: string;
  code: string;
};

export default function AdminPage() {
  const { role } = useRole();

  const [receptionists, setReceptionists] = useState<StaffUser[]>([]);
  const [receptionLoading, setReceptionLoading] = useState(true);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");

  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [receptionName, setReceptionName] = useState("");
  const [receptionEmail, setReceptionEmail] = useState("");
  const [creatingReception, setCreatingReception] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReceptionists() {
      try {
        setReceptionLoading(true);
        const res = await fetch("/api/users");
        if (!res.ok) return;
        const data = (await res.json()) as StaffUser[];
        if (!cancelled) {
          setReceptionists(
            data.filter((u) => u.role === "receptionist"),
          );
        }
      } finally {
        if (!cancelled) setReceptionLoading(false);
      }
    }

    async function loadDoctors() {
      try {
        setLoadingDoctors(true);
        const res = await fetch("/api/doctors");
        if (!res.ok) return;
        const data = (await res.json()) as Doctor[];
        if (!cancelled) setDoctors(data);
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    }

    async function loadRooms() {
      try {
        setLoadingRooms(true);
        const res = await fetch("/api/rooms");
        if (!res.ok) return;
        const data = (await res.json()) as Room[];
        if (!cancelled) setRooms(data);
      } finally {
        if (!cancelled) setLoadingRooms(false);
      }
    }

    loadReceptionists();
    loadDoctors();
    loadRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAddDoctor(e: FormEvent) {
    e.preventDefault();
    if (!doctorName.trim() || !doctorEmail.trim()) return;

    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: doctorName.trim(),
        email: doctorEmail.trim(),
      }),
    });

    if (!res.ok) return;
    const created = (await res.json()) as Doctor;
    setDoctors((prev) => [...prev, created]);
    setDoctorName("");
    setDoctorEmail("");
  }

  async function handleDeleteDoctor(id: string) {
    const res = await fetch(`/api/doctors/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setDoctors((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleAddRoom(e: FormEvent) {
    e.preventDefault();
    if (!roomName.trim() || !roomCode.trim()) return;

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roomName.trim(),
        code: roomCode.trim(),
      }),
    });

    if (!res.ok) return;

    // Ensure we see the latest list even if server logic changes
    const refresh = await fetch("/api/rooms");
    if (refresh.ok) {
      const data = (await refresh.json()) as Room[];
      setRooms(data);
    }

    setRoomName("");
    setRoomCode("");
  }

  async function handleDeleteRoom(id: string) {
    const res = await fetch(`/api/rooms/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleAddReceptionist(e: FormEvent) {
    e.preventDefault();
    if (!receptionName.trim() || !receptionEmail.trim()) return;

    try {
      setCreatingReception(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: receptionName.trim(),
          email: receptionEmail.trim(),
          role: "receptionist",
        }),
      });

      if (!res.ok) {
        setCreatingReception(false);
        return;
      }

      const created = (await res.json()) as StaffUser;
      setReceptionists((prev) => [...prev, created]);
      setReceptionName("");
      setReceptionEmail("");
      setCreatingReception(false);
    } catch {
      setCreatingReception(false);
    }
  }

  async function handleDeleteReceptionist(id: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setReceptionists((prev) => prev.filter((u) => u.id !== id));
  }

  if (role !== "officeManager") {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Admin
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          You do not have permission to view this page.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Administration
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Manage default demo accounts, reception staff, doctors, and rooms.
        </p>
      </header>

      {/* Static default accounts */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Default demo accounts (@example.com)
        </h2>
        <p className="mb-3 text-[0.7rem] text-gray-500 dark:text-gray-400">
          These built-in users always exist for testing. Password for all of
          them: <code>password123</code>.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-gray-200 text-[0.7rem] uppercase tracking-wide text-gray-500 dark:border-neutral-800 dark:text-gray-400">
              <tr>
                <th className="px-2 py-1.5">Name</th>
                <th className="px-2 py-1.5">Role</th>
                <th className="px-2 py-1.5">Employee ID</th>
                <th className="px-2 py-1.5">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              <tr className="align-middle text-[0.75rem]">
                <td className="px-2 py-1.5 font-medium text-gray-900 dark:text-gray-50">
                  Mazda
                </td>
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                  officeManager
                </td>
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                  MGR-1001
                </td>
                <td className="px-2 py-1.5">
                  <a
                    href="mailto:manager@example.com"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    manager@example.com
                  </a>
                </td>
              </tr>
              <tr className="align-middle text-[0.75rem]">
                <td className="px-2 py-1.5 font-medium text-gray-900 dark:text-gray-50">
                  Jay
                </td>
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                  receptionist
                </td>
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                  REC-2001
                </td>
                <td className="px-2 py-1.5">
                  <a
                    href="mailto:reception@example.com"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    reception@example.com
                  </a>
                </td>
              </tr>
              <tr className="align-middle text-[0.75rem]">
                <td className="px-2 py-1.5 font-medium text-gray-900 dark:text-gray-50">
                  Fred
                </td>
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                  doctor
                </td>
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                  DOC-3001
                </td>
                <td className="px-2 py-1.5">
                  <a
                    href="mailto:doctor@example.com"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    doctor@example.com
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Receptionist management */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Additional receptionists (real staff)
        </h2>
        <p className="mb-3 text-[0.7rem] text-gray-500 dark:text-gray-400">
          These users can log in with their email and the default password{" "}
          <code>password123</code>.
        </p>

        <form
          onSubmit={handleAddReceptionist}
          className="mb-4 grid gap-3 md:grid-cols-3"
        >
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={receptionName}
              onChange={(e) => setReceptionName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="e.g. New receptionist"
              required
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={receptionEmail}
              onChange={(e) => setReceptionEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="name@clinic.com"
              required
            />
          </div>

          <div className="flex items-end md:col-span-1">
            <button
              type="submit"
              disabled={creatingReception}
              className="w-full rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {creatingReception ? "Creating…" : "Create receptionist"}
            </button>
          </div>
        </form>

        {receptionLoading ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Loading receptionists…
          </p>
        ) : receptionists.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No additional receptionists yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-gray-200 text-[0.7rem] uppercase tracking-wide text-gray-500 dark:border-neutral-800 dark:text-gray-400">
                <tr>
                  <th className="px-2 py-1.5">Name</th>
                  <th className="px-2 py-1.5">Employee ID</th>
                  <th className="px-2 py-1.5">Email</th>
                  <th className="px-2 py-1.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {receptionists.map((user) => (
                  <tr key={user.id} className="align-middle text-[0.75rem]">
                    <td className="px-2 py-1.5 font-medium text-gray-900 dark:text-gray-50">
                      {user.name}
                    </td>
                    <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                      {user.employeeId}
                    </td>
                    <td className="px-2 py-1.5">
                      <a
                        href={`mailto:${user.email}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {user.email}
                      </a>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteReceptionist(user.id)}
                        className="rounded-lg border border-red-200 px-2 py-1 text-[0.7rem] text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctors & rooms */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Doctors */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Doctors
          </h2>

          <form onSubmit={handleAddDoctor} className="mb-4 space-y-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="e.g. Dr. Fred"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="doctor@clinic.com"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Add doctor
            </button>
          </form>

          {loadingDoctors ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Loading doctors…
            </p>
          ) : doctors.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No doctors defined yet.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {doctors.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 dark:border-neutral-800"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {d.name}
                    </span>
                    <a
                      href={`mailto:${d.email}`}
                      className="text-[0.7rem] text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {d.email}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoctor(d.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-[0.7rem] text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rooms */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Rooms
          </h2>

          <form onSubmit={handleAddRoom} className="mb-4 space-y-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Room name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="e.g. Exam Room 1"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Code / number
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="e.g. R-101"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Add room
            </button>
          </form>

          {loadingRooms ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Loading rooms…
            </p>
          ) : rooms.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No rooms defined yet.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {rooms.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 dark:border-neutral-800"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {r.name}
                    </span>
                    <span className="text-[0.7rem] text-gray-500 dark:text-gray-400">
                      {r.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(r.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-[0.7rem] text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}