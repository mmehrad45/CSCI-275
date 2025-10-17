import { pool } from '../db.js';
import bcrypt from 'bcryptjs';

// Function to create a new user (for signup)
export async function createUser({ email, password, full_name, role = 'staff' }) {
  // Hash the password before saving
  const hash = await bcrypt.hash(password, 10);

  // Insert the user into the database
  const [res] = await pool.execute(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES (?,?,?,?)',
    [email, hash, full_name, role]
  );

  // Return the new user info
  return { id: res.insertId, email, full_name, role };
}

// Function to find a user by email (for login)
export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, email, password_hash, full_name, role FROM users WHERE email=? LIMIT 1',
    [email]
  );
  return rows[0];
}
