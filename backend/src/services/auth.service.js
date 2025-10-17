import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}
