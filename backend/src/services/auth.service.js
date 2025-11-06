// backend/src/services/auth.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(plain) {
  // 10 rounds to match the seeded admin hash
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  // Guard against null/undefined hash values
  return bcrypt.compare(plain, hash || "");
}

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
}
