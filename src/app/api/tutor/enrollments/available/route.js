// app/api/tutor/enrollments/available/route.js (fixed to use tutor_id)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/auth';
import { query } from '../../../lib/database';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch tutor_id first
    const tutorRes = await query('SELECT id FROM tutors WHERE user_id = $1', [decoded.id]);
    const tutorId = tutorRes.rows[0]?.id;
    if (!tutorId) {
      return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
    }

    const url = new URL(req.url);
    const name = url.searchParams.get('name') || '';
    const grade = url.searchParams.get('grade') || '';

    let params = [tutorId];  // Use tutorId for subquery
    let whereClause = 'WHERE s.id NOT IN (SELECT student_id FROM enrollments WHERE status = \'active\' AND tutor_id = $1) AND u.status = \'active\'';
    let orderBy = 'ORDER BY u.full_name ASC';

    let paramIndex = 2;
    if (name) {
      whereClause += ` AND u.full_name ILIKE $${paramIndex++}`;
      params.push(`%${name}%`);
    }

    if (grade) {
      whereClause += ` AND g.year = $${paramIndex++}`;
      params.push(grade);
    }

    const result = await query(
      `SELECT s.id, u.full_name, g.grade_name
       FROM students s
       JOIN users u ON u.id = s.user_id
       JOIN grades g ON s.current_grade_id = g.id
       ${whereClause}
       ${orderBy}`,
      params
    );

    return NextResponse.json({ students: result.rows });
  } catch (error) {
    console.error('Error fetching available students:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}