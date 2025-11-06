// backend/src/routes/auth.routes.js
import { Router } from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";
import { hashPassword, signToken } from "../services/auth.service.js";

const router = Router();

/**
 * POST /auth/register
 * body: { email, password, full_name, role? }
 */
router.post("/register", async (req, res) => {
  try {
    let { email, password, full_name, role } = req.body || {};
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "email, password, full_name are required" });
    }

    const emailNorm = String(email).trim().toLowerCase();

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
      [emailNorm]
    );
    if (existing.length) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await hashPassword(password);

    await pool.query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
      [emailNorm, password_hash, full_name, role || "staff"]
    );

    return res.status(201).json({ message: "Registered" });
  } catch (e) {
    console.error("[REGISTER] error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /auth/login
 * body: { email, password }
 * This version:
 *  - Normalizes email (trim/lowercase)
 *  - Case-insensitive lookup (LOWER(email) = ?)
 *  - Uses bcrypt.compare directly (no service indirection)
 *  - Logs precise debug markers so we know exactly what path fired
 */



// --- DEBUG HELPERS (TEMPORARY) ---
router.get("/ping", (_req, res) => {
  console.log("[AUTH] /ping hit");
  res.json({ ok: true });
});

router.get("/debug-user", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT id, email, full_name, role, LEFT(password_hash,4) AS prefix, LENGTH(password_hash) AS len FROM users WHERE LOWER(email) = ? LIMIT 1",
      [email]
    );
    console.log("[DEBUG-USER] email =", email, "rows.length =", rows.length);
    res.json({ rows });
  } catch (e) {
    console.error("[DEBUG-USER] error", e);
    res.status(500).json({ error: "debug error" });
  }
});

router.post("/debug-compare", async (req, res) => {
  try {
    const bcrypt = (await import("bcryptjs")).default;
    let { email, password } = req.body || {};
    email = String(email || "").trim().toLowerCase();
    password = String(password || "");
    const [rows] = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE LOWER(email) = ? LIMIT 1",
      [email]
    );
    if (!rows.length) return res.json({ found: false });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || "");
    console.log("[DEBUG-COMPARE]", email, "found:", !!user, "compare:", ok);
    res.json({ found: true, compare: ok });
  } catch (e) {
    console.error("[DEBUG-COMPARE] error", e);
    res.status(500).json({ error: "debug error" });
  }
});
// --- END DEBUG HELPERS ---


// TEMP: set a user's password by hashing on the server
router.post("/debug-set-password", async (req, res) => {
  try {
    const bcrypt = (await import("bcryptjs")).default;
    let { email, password } = req.body || {};
    const emailNorm = String(email || "").trim().toLowerCase();
    const plain = String(password || "");

    if (!emailNorm || !plain) {
      return res.status(400).json({ error: "email and password required" });
    }

    const hash = await bcrypt.hash(plain, 10);
    const [result] = await pool.query(
      "UPDATE users SET password_hash = ? WHERE LOWER(email) = ?",
      [hash, emailNorm]
    );

    return res.json({ updated: result.affectedRows === 1, email: emailNorm });
  } catch (e) {
    console.error("[DEBUG-SET-PASSWORD] error", e);
    res.status(500).json({ error: "debug error" });
  }
});




router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) {
      console.log("[LOGIN] 400 missing fields");
      return res.status(400).json({ error: "email and password required" });
    }

    const emailNorm = String(email).trim().toLowerCase();
    console.log("[LOGIN] emailNorm =", emailNorm);

    const [rows] = await pool.query(
      "SELECT id, email, password_hash, full_name, role FROM users WHERE LOWER(email) = ? LIMIT 1",
      [emailNorm]
    );

    console.log("[LOGIN] rows.length =", rows.length);
    if (!rows.length) {
      console.log("[LOGIN] 401 user not found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    console.log("[LOGIN] dbEmail =", user.email);

    // Direct bcrypt compare
    const ok = await bcrypt.compare(String(password), user.password_hash || "");
    console.log("[LOGIN] bcrypt.compare =", ok);

    if (!ok) {
      console.log("[LOGIN] 401 bad password");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    console.log("[LOGIN] 200 success for", user.email);

    return res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (e) {
    console.error("[LOGIN] 500 error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
