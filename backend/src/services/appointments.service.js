import { db } from '../db.js'; // your mysql2/promise pool or connection

export async function createAppointmentByName({ patientName, providerName, startTime, endTime, reason, notes }) {
  const [result] = await db.execute(
    `INSERT INTO appointments (patient_name, provider_name, start_time, end_time, reason, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [patientName, providerName, toMysqlDT(startTime), toMysqlDT(endTime), reason, notes]
  );

  const [rows] = await db.execute(
    `SELECT id,
            patient_name  AS patientName,
            provider_name AS providerName,
            start_time    AS startTime,
            end_time      AS endTime,
            reason, notes, status
     FROM appointments
     WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
}

export async function listAppointments({ q } = {}) {
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    const [rows] = await db.execute(
      `SELECT id,
              patient_name  AS patientName,
              provider_name AS providerName,
              start_time    AS startTime,
              end_time      AS endTime,
              reason, notes, status
       FROM appointments
       WHERE patient_name LIKE ?
          OR provider_name LIKE ?
       ORDER BY start_time DESC`,
      [like, like]
    );
    return rows;
  }

  const [rows] = await db.execute(
    `SELECT id,
            patient_name  AS patientName,
            provider_name AS providerName,
            start_time    AS startTime,
            end_time      AS endTime,
            reason, notes, status
     FROM appointments
     ORDER BY start_time DESC`
  );
  return rows;
}

export async function cancelAppointment(id) {
  const [res] = await db.execute(
    `UPDATE appointments SET status='canceled' WHERE id = ?`,
    [id]
  );
  return res.affectedRows > 0;
}

// helper
function toMysqlDT(input) {
  // accepts Date or ISO string "YYYY-MM-DDTHH:MM"
  const d = (input instanceof Date) ? input : new Date(input);
  const pad = n => (n < 10 ? '0' + n : n);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}
