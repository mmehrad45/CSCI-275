import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import pool from "./db.js";
import patientsRoutes from "./routes/patients.routes.js";
import { authRequired } from "./middleware/auth.js";

import appointmentsRoutes from "./routes/appointments.routes.js";


const app = express();

// Open CORS for local dev (adjust later if needed)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// DB check (diagnostics)
app.get("/db-check", async (_req, res) => {
  try {
    const [dbres] = await pool.query("SELECT DATABASE() AS db");
    const [ping]  = await pool.query("SELECT 1 AS ok");
    res.json({
      connected: true,
      database: dbres?.[0]?.db,
      ping: ping?.[0]?.ok === 1
    });
  } catch (e) {
    console.error("DB-CHECK ERROR:", e);
    res.status(500).json({ connected: false, error: String(e?.message || e) });
  }
});

// Auth
app.use("/auth", authRoutes);

// Patients (protected)
app.use("/patients", patientsRoutes);

// Appointments (you can protect later with authRequired if you want)
app.use("/appointments", appointmentsRoutes);
// If you want it protected now, use this instead:
// app.use("/appointments", authRequired, appointmentsRoutes);


export default app;
