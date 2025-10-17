import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "clinicflow_db",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;     // default export
export { pool };         // (optional) named export too
