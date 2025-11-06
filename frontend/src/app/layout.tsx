// src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PatientProvider } from "@/context/PatientContext";

export const metadata = {
  title: "ClinicFlow",
  description: "Clinic management app for CSCI-275",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Prevents dark-mode/theme hydration warnings when class is added on client
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <PatientProvider>{children}</PatientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
