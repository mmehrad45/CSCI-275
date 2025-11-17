import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { PatientProvider } from "@/context/PatientContext";
import { AppointmentProvider } from "@/context/AppointmentContext";
import { RoleProvider } from "@/context/RoleContext";
import { TaskProvider } from "@/context/TaskContext";

export const metadata: Metadata = {
  title: "CSCI-275",
  description: "ClinicFlow Sprint 1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <RoleProvider>
              <PatientProvider>
                <AppointmentProvider>
                  <TaskProvider>{children}</TaskProvider>
                </AppointmentProvider>
              </PatientProvider>
            </RoleProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}