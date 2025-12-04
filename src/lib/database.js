// src/lib/database.js
import pkg from 'pg';
const { Pool } = pkg;

console.log('Creating pool with DATABASE_URL =', process.env.DATABASE_URL ? 'SET' : 'MISSING');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For Neon: Let URL handle SSL; no override needed
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function getExamById(id) {
  const result = await query('SELECT * FROM exams WHERE id = $1', [id]);
  return result.rows[0];
}

export default pool;