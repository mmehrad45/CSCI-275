import { Router } from "express";
import pool from "../db.js";
import { hashPassword, verifyPassword, signToken } from "../services/auth.service.js";

const router = Router();

/**
 * POST /auth/register
 * body: { email, password, full_name, role? }
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body || {};
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "email, password, full_name are required" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await hashPassword(password);
    await pool.query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
      [email, password_hash, full_name, role || "staff"]
    );

    return res.status(201).json({ message: "Registered" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const [rows] = await pool.query(
      "SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;


