// src/routes/appointments.routes.js
import { Router } from "express";
import pool from "../db.js";
// import { authRequired } from "../middleware/auth.js"; // enable when you want auth

const router = Router();

// If you want to require auth for all endpoints now, uncomment:
// router.use(authRequired);

// POST /appointments — book by patient name
router.post("/", async (req, res) => {
  try {
    const { patientName, providerName, startISO, endISO, reason, notes } = req.body;

    if (!patientName || !startISO || !endISO) {
      return res
        .status(400)
        .json({ error: "patientName, startISO, and endISO are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO appointments (patient_name, provider_name, start_time, end_time, reason, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        patientName.trim(),
        (providerName || "General").trim(),
        toMysqlDT(startISO),
        toMysqlDT(endISO),
        reason?.trim() || null,
        notes?.trim() || null,
      ]
    );

    const [rows] = await pool.query(
      `SELECT id,
              patient_name  AS patientName,
              provider_name AS providerName,
              start_time    AS startTime,
              end_time      AS endTime,
              reason, notes, status
       FROM appointments
       WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("POST /appointments error:", e);
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

// GET /appointments (optional search by ?q=)
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();

    let rows;
    if (q) {
      const like = `%${q}%`;
      [rows] = await pool.query(
        `SELECT id,
                patient_name  AS patientName,
                provider_name AS providerName,
                start_time    AS startTime,
                end_time      AS endTime,
                reason, notes, status
         FROM appointments
         WHERE patient_name LIKE ? OR provider_name LIKE ?
         ORDER BY start_time DESC`,
        [like, like]
      );
    } else {
      [rows] = await pool.query(
        `SELECT id,
                patient_name  AS patientName,
                provider_name AS providerName,
                start_time    AS startTime,
                end_time      AS endTime,
                reason, notes, status
         FROM appointments
         ORDER BY start_time DESC`
      );
    }

    res.json(rows);
  } catch (e) {
    console.error("GET /appointments error:", e);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// PATCH /appointments/:id/cancel — set status to 'canceled'
router.patch("/:id/cancel", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const [result] = await pool.query(
      `UPDATE appointments SET status='canceled' WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("PATCH /appointments/:id/cancel error:", e);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
});

// helper
function toMysqlDT(input) {
  // accepts Date/ISO like "YYYY-MM-DDTHH:MM"
  const d = input instanceof Date ? input : new Date(input);
  const pad = (n) => (n < 10 ? "0" + n : n);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export default router;
