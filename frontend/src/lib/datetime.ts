// src/lib/datetime.ts
export function formatLocal(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    ...opts,
  }).format(new Date(iso));
}

export function formatLocalRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);

  const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
  const timeFmt = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${dateFmt.format(start)}, ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
  }
  return `${dateFmt.format(start)} ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
}
