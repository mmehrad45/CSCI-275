import { pool } from '../db.js';

// Get all patients from the database
export async function listPatients() {
  const [rows] = await pool.execute('SELECT * FROM patients ORDER BY created_at DESC');
  return rows;
}

// Add a new patient
export async function addPatient({ first_name, last_name, dob, phone, email, notes }) {
  const [res] = await pool.execute(
    'INSERT INTO patients (first_name, last_name, dob, phone, email, notes) VALUES (?,?,?,?,?,?)',
    [first_name, last_name, dob || null, phone || null, email || null, notes || null]
  );
  return { id: res.insertId };
}
