// src/components/AssistantChat.tsx
"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAppointments } from "@/context/AppointmentContext";
// Removed: import { usePatients } from "@/context/PatientContext";
import { DOCTORS, ROOMS, Appointment } from "@/lib/appointments";
import Button from "@/components/Button";

type ChatMessage = { id: number; sender: "user" | "assistant"; text: string; createdAt: number };
type TypingState = { id: number; fullText: string; index: number } | null;

function formatTimeLabel(date: number): string {
  const d = new Date(date);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function summarizeSchedule(appointments: Appointment[]) {
  const doctorLoads: Record<string, number> = {};
  const roomLoads: Record<string, number> = {};
  for (const a of appointments) {
    doctorLoads[a.doctorId] = (doctorLoads[a.doctorId] ?? 0) + 1;
    roomLoads[a.roomId] = (roomLoads[a.roomId] ?? 0) + 1;
  }
  let busiestDoctor: { id: string; count: number } | undefined;
  for (const [id, count] of Object.entries(doctorLoads)) {
    if (!busiestDoctor || count > busiestDoctor.count) busiestDoctor = { id, count };
  }
  return { busiestDoctor, doctorLoads, roomLoads };
}

function detectBackToBack(appointments: Appointment[]): string[] {
  const warnings: string[] = [];
  const byDoctorAndDate: Record<string, Record<string, Appointment[]>> = {};
  for (const a of appointments) {
    byDoctorAndDate[a.doctorId] ??= {};
    byDoctorAndDate[a.doctorId][a.date] ??= [];
    byDoctorAndDate[a.doctorId][a.date].push(a);
  }
  for (const [doctorId, days] of Object.entries(byDoctorAndDate)) {
    for (const [date, appts] of Object.entries(days)) {
      const sorted = [...appts].sort((x, y) => `${x.date}T${x.time}`.localeCompare(`${y.date}T${y.time}`));
      let streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prevTime = new Date(`${sorted[i - 1].date}T${sorted[i - 1].time}`);
        const curTime = new Date(`${sorted[i].date}T${sorted[i].time}`);
        const diffMinutes = (curTime.getTime() - prevTime.getTime()) / (1000 * 60);
        streak = diffMinutes <= 30 && diffMinutes >= 0 ? streak + 1 : 1;
        if (streak >= 3) {
          const doc = DOCTORS.find((d) => d.id === doctorId);
          const name = doc ? doc.name : doctorId;
          warnings.push(
            `${name} has at least ${streak} back-to-back appointments on ${date}. It might help to move one or two of those to a quieter time or a different provider.`,
          );
          break;
        }
      }
    }
  }
  return warnings;
}

function getTodayString(offsetDays = 0): string {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function docName(id: string): string {
  return DOCTORS.find((d) => d.id === id)?.name ?? id;
}
function roomName(id: string): string {
  return ROOMS.find((r) => r.id === id)?.name ?? id;
}

function buildAssistantReply(userText: string, appointments: Appointment[]): string {
  const text = userText.trim();
  const lower = text.toLowerCase();

  if (!appointments.length) {
    return [
      "Right now I don’t see any appointments in the system.",
      "Once you start booking visits, I can help you spot overloaded doctors, busy rooms and quiet gaps you can use for same-day or urgent bookings.",
      "For example, you could ask me things like:\n• “How busy are the doctors today?”\n• “Do we have any free rooms this afternoon?”\n• “Can you suggest a more efficient schedule for tomorrow?”",
    ].join("\n\n");
  }

  const total = appointments.length;
  const todayStr = getTodayString(0);
  const tomorrowStr = getTodayString(1);

  const { busiestDoctor, doctorLoads, roomLoads } = summarizeSchedule(appointments);
  const backToBackWarnings = detectBackToBack(appointments);

  const describeDay = (dateStr: string, label: string): string | null => {
    const dayAppts = appointments.filter((a) => a.date === dateStr);
    if (!dayAppts.length) return `${label} there are no appointments booked yet. You could keep a few prime slots reserved for same-day requests if that’s part of your flow.`;
    const byDoctor: Record<string, number> = {};
    for (const a of dayAppts) byDoctor[a.doctorId] = (byDoctor[a.doctorId] ?? 0) + 1;

    const parts: string[] = [];
    parts.push(`${label} you have ${dayAppts.length} appointment${dayAppts.length === 1 ? "" : "s"} booked in total.`);
    const docDescriptions = Object.entries(byDoctor).map(([id, count]) => `${docName(id)} (${count})`).join(", ");
    if (docDescriptions) parts.push(`That breaks down roughly as: ${docDescriptions}.`);
    return parts.join(" ");
  };

  const lines: string[] = [];
  if (/\b(hi|hello|hey|yo|sup)\b/i.test(lower)) {
    lines.push("Hey! I’m keeping an eye on your schedule so you don’t have to stare at it all day.");
  }

  lines.push(`Right now there are ${total} appointment${total === 1 ? "" : "s"} in the system.`);

  const todaySummary = describeDay(todayStr, "Today");
  if (todaySummary) lines.push(todaySummary);

  if (lower.includes("tomorrow") || lower.includes("next day") || lower.includes("future")) {
    const tomorrowSummary = describeDay(tomorrowStr, "Tomorrow");
    if (tomorrowSummary) lines.push(tomorrowSummary);
  }

  if (lower.includes("busiest") || lower.includes("who is busy") || lower.includes("which doctor")) {
    if (busiestDoctor) {
      const avg =
        Object.values(doctorLoads).reduce((sum, n) => sum + n, 0) / Math.max(1, Object.keys(doctorLoads).length);
      lines.push(
        `The busiest doctor overall is ${docName(busiestDoctor.id)}, with ${busiestDoctor.count} appointment${
          busiestDoctor.count === 1 ? "" : "s"
        } on their list. That’s compared to an average of about ${avg.toFixed(1)} per doctor.`,
      );
      lines.push(
        `If you want to ease things a little for ${docName(
          busiestDoctor.id,
        )}, you could:\n` +
          "• Move a couple of shorter follow-ups to a quieter doctor.\n" +
          "• Keep one central gap in the middle of their day for catch-up or urgent add-ons.\n" +
          "• Shift at least one non-urgent visit to a lighter day or a less busy provider.",
      );
    }
  }

  if (lower.includes("room") || lower.includes("rooms")) {
    const highRoomLoads = Object.entries(roomLoads)
      .filter(([, count]) => count >= 4)
      .map(([id, count]) => `${roomName(id)} (${count})`);
    if (highRoomLoads.length) {
      lines.push(
        `Rooms that are working the hardest right now are: ${highRoomLoads.join(
          ", ",
        )}. If you notice bottlenecks at the front desk, you could shift a few visits into quieter rooms to spread out traffic.`,
      );
    } else {
      lines.push(
        "Room usage actually looks fairly balanced at the moment. If you’d like, you can tell me a specific room and day and I can take a closer look in the calendar.",
      );
    }
  }

  if (lower.includes("optimize") || lower.includes("more efficient") || lower.includes("efficiency") || lower.includes("suggest") || lower.includes("improve")) {
    lines.push(
      "If you want to make the schedule more efficient, a few simple tweaks go a long way:\n" +
        "• Put quick follow-up visits in short, back-to-back blocks, but leave a small buffer before long or complex visits.\n" +
        "• Try to keep at least one flexible slot per doctor in the late morning or early afternoon for urgent same-day bookings.\n" +
        "• If one doctor has a very heavy day while another is quiet, move routine check-ins to the lighter schedule when clinically appropriate.",
    );
  }

  if (backToBackWarnings.length) lines.push(backToBackWarnings.join(" "));

  if (!lines.length) {
    lines.push(
      "Overall, things look fairly reasonable. If you tell me what you’re worried about — for example “afternoon is too packed” or “Dr. Chen is overloaded” — I can give more specific suggestions.",
    );
  }
  return lines.join("\n\n");
}

const SUGGESTED_QUESTIONS = [
  "How busy are the doctors today?",
  "Do we have any overloaded rooms?",
  "Any suggestions to make tomorrow more efficient?",
];

export default function AssistantChat() {
  const { appointments } = useAppointments();
  // Removed: const { patients } = usePatients();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 1,
      sender: "assistant",
      createdAt: Date.now(),
      text:
        "Hi, I’m the ClinicFlow assistant. I read your appointment schedule and try to spot things like overloaded doctors, busy rooms and opportunities to smooth out the day.\n\n" +
        "You can talk to me just like you would to a coworker — for example: “How busy are we today?”, “Any free slots for Dr. Singh this afternoon?”, or “Can you suggest a more efficient layout for tomorrow?”.",
    },
  ]);
  const nextIdRef = useRef<number>(2);
  const [typing, setTyping] = useState<TypingState>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const canSend = input.trim().length > 0;

  function addMessage(partial: Omit<ChatMessage, "id" | "createdAt"> & { createdAt?: number }): number {
    const id = nextIdRef.current++;
    const message: ChatMessage = { id, sender: partial.sender, text: partial.text, createdAt: partial.createdAt ?? Date.now() };
    setMessages((prev) => [...prev, message]);
    return id;
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, typing]);

  useEffect(() => {
    if (!typing) return;
    if (typing.index >= typing.fullText.length) {
      setTyping(null);
      return;
    }
    const timeout = setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === typing.id ? { ...m, text: typing.fullText.slice(0, typing.index + 1) } : m)));
      setTyping((prev) => (prev ? { ...prev, index: prev.index + 1 } : null));
    }, 15);
    return () => clearTimeout(timeout);
  }, [typing]);

  function startTypingReply(userText: string) {
    const full = buildAssistantReply(userText, appointments);
    const id = addMessage({ sender: "assistant", text: "" });
    setTyping({ id, fullText: full, index: 0 });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    const userText = input.trim();
    setInput("");
    addMessage({ sender: "user", text: userText });
    startTypingReply(userText);
  }

  function handleQuickAsk(q: string) {
    addMessage({ sender: "user", text: q });
    startTypingReply(q);
  }

  const floatingLabel = useMemo(() => {
    const total = appointments.length;
    if (!total) return "No appointments yet";
    if (total === 1) return "1 appointment scheduled";
    return `${total} appointments scheduled`;
  }, [appointments.length]);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open assistant chat"
        title={floatingLabel}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-600/40 outline-none ring-blue-300 hover:bg-blue-700 focus-visible:ring-2 dark:bg-blue-500 dark:shadow-blue-500/40 dark:hover:bg-blue-400"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/70">
          <span className="h-3 w-3 rounded-full bg-white/90" />
        </span>
      </button>

      {/* Chat panel */}
      <div
        className={[
          "fixed bottom-24 right-5 z-40 flex h-[440px] w-[380px] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900",
          "transform transition-all duration-300 ease-out",
          isOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-4 opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-blue-600 px-3 py-2 dark:border-neutral-800 dark:bg-blue-500">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70">
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">ClinicFlow Assistant</div>
              <div className="text-[0.7rem] text-blue-100">“Friendly scheduler” for reception</div>
            </div>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} className="rounded-full px-2 text-xs text-blue-50 hover:bg-blue-500/60">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-2 text-sm dark:bg-neutral-950">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={[
                  "max-w-[80%] rounded-2xl px-3 py-2 text-xs",
                  m.sender === "user" ? "bg-blue-600 text-white dark:bg-blue-500" : "bg-white text-gray-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50",
                ].join(" ")}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div className={`mt-1 text-[0.6rem] ${m.sender === "user" ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}>
                  {formatTimeLabel(m.createdAt)}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="mt-1 rounded-2xl bg-white px-3 py-1 text-[0.6rem] text-gray-400 shadow-sm dark:bg-neutral-900 dark:text-gray-500">
                Assistant is typing…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        <div className="border-t border-gray-200 bg-white px-2 py-1.5 text-[0.7rem] text-gray-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300">
          <div className="mb-1 font-medium">Quick questions you can try:</div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleQuickAsk(q)}
                className="rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-[0.7rem] hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white px-2 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about today’s schedule…"
              className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <Button type="submit" disabled={!canSend} className="px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60">
              Send
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}