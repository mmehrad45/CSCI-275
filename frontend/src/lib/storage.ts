"use client";

// Safe JSON helpers for localStorage (browser-only).
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // ignore write errors
  }
}