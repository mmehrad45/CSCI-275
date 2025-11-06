import pool from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function login(req, res) {
  try {
    let { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Normalize
    email = email.trim().toLowerCase();

    // Case-insensitive lookup
    const [rows] = await pool.query(
      "SELECT id, email, full_name, role, password_hash FROM users WHERE LOWER(email) = ? LIMIT 1",
      [email]
    );
    const user = rows?.[0];

    if (!user) {
      console.log("[LOGIN] user not found for", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare with bcryptjs
    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) {
      console.log("[LOGIN] bad password for", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "7d" }
    );

    console.log("[LOGIN] success for", email);
    return res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error("[LOGIN] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
