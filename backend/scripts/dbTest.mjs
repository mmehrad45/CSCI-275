// scripts/dbTest.mjs
import 'dotenv/config';
import { pool } from '../src/db/mysql.js';

try {
  const [rows] = await pool.query('SELECT DATABASE() AS db, NOW() AS now');
  console.log('✅ DB OK:', rows[0]);
} catch (e) {
  console.error('❌ DB ERROR:', e.message);
} finally {
  await pool.end();
}
