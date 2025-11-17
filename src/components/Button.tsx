"use client";
import { ButtonHTMLAttributes } from "react";

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition
                  active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed
                  bg-blue-600 text-white hover:bg-blue-700
                  dark:bg-blue-500 dark:hover:bg-blue-600 ${className}`}
    />
  );
}