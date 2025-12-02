// ============================================
// FILE: app/api/student/exams/available/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { query } from '../../../../../lib/database';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = verifyToken(token);

    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student info
    const studentResult = await query(
      'SELECT s.id, s.current_grade_id FROM students s JOIN users u ON s.user_id = u.id WHERE u.id = $1',
      [user.id]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = studentResult.rows[0];

    // Get available exams for student's grade
    const examsResult = await query(`
      SELECT 
        ae.id,
        ae.exam_name,
        ae.grade_id,
        g.grade_name,
        ae.exam_date,
        ae.registration_start_date,
        ae.registration_end_date,
        ae.status,
        ae.description,
        ae.published_at,
        COUNT(DISTINCT aes.subject_id) as subject_count
      FROM admin_exams ae
      JOIN grades g ON ae.grade_id = g.id
      LEFT JOIN admin_exam_subjects aes ON ae.id = aes.admin_exam_id
      WHERE ae.grade_id = $1
        AND ae.status IN ('registration_open', 'in_progress', 'completed', 'published')
      GROUP BY ae.id, g.grade_name
      ORDER BY ae.exam_date DESC
    `, [student.current_grade_id]);

    return NextResponse.json({ exams: examsResult.rows });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}