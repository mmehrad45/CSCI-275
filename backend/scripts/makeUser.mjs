// scripts/makeUser.mjs
import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const email = process.argv[2] || "admin@example.com";
const password = process.argv[3] || "Password123!";
const full_name = process.argv[4] || "Admin User";
const role = process.argv[5] || "admin";

async function main() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
  });

  try {
    const hash = await bcrypt.hash(password, 10);

    // Adjust ONLY if your column/table names differ.
    // Expected schema: users(id, email UNIQUE, password_hash, full_name, role)
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         full_name = VALUES(full_name),
         role = VALUES(role)`,
      [email, hash, full_name, role]
    );

    console.log("✅ user ready:", { email, role });
  } catch (e) {
    console.error("❌ makeUser error:", e.message);
  } finally {
    await pool.end();
  }
}

main();
