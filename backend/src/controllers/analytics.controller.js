// backend/src/controllers/analytics.controller.js
// Auto-detects common column names in `appointments` and computes:
// - totals (total/completed/cancelled/no_show/avg wait/revenue)
// - byDay (group by date)
// - byDoctor (group by doctor)
import pool from "../db.js";

function dateRange(from, to) {
  // inclusive end-of-day
  const fromDt = `${from} 00:00:00`;
  const toDt = `${to} 23:59:59`;
  return { fromDt, toDt };
}

export async function getSummary(req, res) {
  try {
    const { from, to } = req.query || {};
    if (!from || !to) {
      return res.json({
        totals: { total: 0, completed: 0, cancelled: 0, noShow: 0, avgWaitMin: null, revenue: 0 },
        byDay: [],
        byDoctor: [],
      });
    }
    const { fromDt, toDt } = dateRange(from, to);

    // 1) Discover column names in `appointments`
    const [colsRows] = await pool.query("SHOW COLUMNS FROM appointments");
    const cols = new Set(colsRows.map((r) => r.Field));

    const pick = (...cands) => cands.find((c) => cols.has(c));
    const dateCol = pick("scheduled_at", "appointment_date", "date", "start_time", "created_at");
    const statusCol = pick("status", "state");
    const doctorNameCol = pick("doctor_name", "doctor", "physician_name");
    const doctorIdCol = pick("doctor_id", "physician_id", "provider_id");
    const feeCol = pick("fee", "amount", "price", "charge", "payment_amount");
    const checkinCol = pick("checkin_time", "checked_in_at", "check_in_time");
    const startCol = pick("start_time", "started_at", "begin_time");

    if (!dateCol) {
      return res.status(500).json({ error: "appointments table is missing a date/time column (e.g., scheduled_at)" });
    }
    if (!statusCol) {
      return res.status(500).json({ error: "appointments table is missing a status column" });
    }

    // Helpers for status matches
    // (accepts values like 'no_show', 'no-show', 'no show' as no-show)
    const isCompleted = `LOWER(${statusCol}) = 'completed'`;
    const isCancelled = `LOWER(${statusCol}) = 'cancelled'`;
    const isNoShow = `REPLACE(REPLACE(LOWER(${statusCol}),'-',' '),'_',' ') = 'no show'`;

    // 2) Totals
    const totalsSql = `
      SELECT
        COUNT(*) AS total,
        SUM(${isCompleted}) AS completed,
        SUM(${isCancelled}) AS cancelled,
        SUM(${isNoShow}) AS no_show,
        ${
          checkinCol && startCol
            ? `AVG(NULLIF(TIMESTAMPDIFF(MINUTE, ${checkinCol}, ${startCol}), NULL))`
            : `NULL`
        } AS avg_wait_min,
        ${feeCol ? `COALESCE(SUM(${feeCol}),0)` : `0`} AS revenue
      FROM appointments
      WHERE ${dateCol} BETWEEN ? AND ?;
    `;

    const [totalsRow] = await pool.query(totalsSql, [fromDt, toDt]);
    const totals = totalsRow?.[0] || {
      total: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      avg_wait_min: null,
      revenue: 0,
    };

    // 3) By Day
    const byDaySql = `
      SELECT
        DATE(${dateCol}) AS day,
        COUNT(*) AS total,
        SUM(${isCompleted}) AS completed,
        SUM(${isCancelled}) AS cancelled,
        SUM(${isNoShow}) AS no_show,
        ${feeCol ? `COALESCE(SUM(${feeCol}),0)` : `0`} AS revenue
      FROM appointments
      WHERE ${dateCol} BETWEEN ? AND ?
      GROUP BY DATE(${dateCol})
      ORDER BY DATE(${dateCol}) ASC;
    `;
    const [byDay] = await pool.query(byDaySql, [fromDt, toDt]);

    // 4) By Doctor (fall back to ID if no name column)
    let byDoctor = [];
    if (doctorNameCol || doctorIdCol) {
      const doctorKey = doctorNameCol || doctorIdCol;
      const byDoctorSql = `
        SELECT
          ${doctorKey} AS doctorName,
          COUNT(*) AS total,
          SUM(${isCompleted}) AS completed,
          SUM(${isCancelled}) AS cancelled,
          SUM(${isNoShow}) AS no_show,
          ${
            checkinCol && startCol
              ? `AVG(NULLIF(TIMESTAMPDIFF(MINUTE, ${checkinCol}, ${startCol}), NULL))`
              : `NULL`
          } AS avgWaitMinutes
        FROM appointments
        WHERE ${dateCol} BETWEEN ? AND ?
        GROUP BY ${doctorKey}
        ORDER BY total DESC;
      `;
      const [rows] = await pool.query(byDoctorSql, [fromDt, toDt]);
      byDoctor = rows;
    }

    return res.json({
      totals: {
        total: Number(totals.total || 0),
        completed: Number(totals.completed || 0),
        cancelled: Number(totals.cancelled || 0),
        noShow: Number(totals.no_show || 0),
        avgWaitMin: totals.avg_wait_min !== null ? Number(totals.avg_wait_min) : null,
        revenue: Number(totals.revenue || 0),
      },
      byDay,
      byDoctor,
    });
  } catch (err) {
    console.error("[ANALYTICS getSummary] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
