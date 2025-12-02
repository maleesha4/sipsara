// src/lib/database.js
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pkg from 'pg';
const { Pool } = pkg;

console.log('Creating pool with DATABASE_URL =', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query(text, params) {
  const client = await pool.connect();
  const result = await client.query(text, params);
  client.release();
  return result;
}

export async function getExamById(id) {
  const result = await query('SELECT * FROM exams WHERE id = $1', [id]);
  return result.rows[0]; // Return the first exam found
}

export default pool;