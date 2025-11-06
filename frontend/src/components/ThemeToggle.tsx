"use client";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const effective = theme === "system" ? systemTheme : theme;

  return (
    <button
      onClick={() => setTheme(effective === "dark" ? "light" : "dark")}
      className="text-sm px-3 py-1 rounded-xl border border-gray-300 dark:border-neutral-700"
    >
      {effective === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}