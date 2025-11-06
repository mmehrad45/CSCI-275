import { Router } from "express";
import pool from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// Get all patients (most recent first)
router.get("/", authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, first_name, last_name, dob, phone, email, notes, created_at FROM patients ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a patient
router.post("/", authRequired, async (req, res) => {
  try {
    const { first_name, last_name, dob, phone, email, notes } = req.body || {};
    if (!first_name || !last_name) {
      return res.status(400).json({ error: "first_name and last_name are required" });
    }
    const [result] = await pool.query(
      "INSERT INTO patients (first_name, last_name, dob, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [first_name, last_name, dob || null, phone || null, email || null, notes || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Get one patient
router.get("/:id", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, first_name, last_name, dob, phone, email, notes, created_at FROM patients WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Update a patient
router.put("/:id", authRequired, async (req, res) => {
  try {
    const { first_name, last_name, dob, phone, email, notes } = req.body || {};
    await pool.query(
      "UPDATE patients SET first_name=?, last_name=?, dob=?, phone=?, email=?, notes=? WHERE id=?",
      [first_name || null, last_name || null, dob || null, phone || null, email || null, notes || null, req.params.id]
    );
    res.json({ updated: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a patient
router.delete("/:id", authRequired, async (req, res) => {
  try {
    await pool.query("DELETE FROM patients WHERE id=?", [req.params.id]);
    res.json({ deleted: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
