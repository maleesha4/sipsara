// ============================================
// FILE: app/api/student/exams/[examId]/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { query } from '../../../../../lib/database';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
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

    // Get student's grade
    const studentResult = await query(
      'SELECT s.current_grade_id FROM students s JOIN users u ON s.user_id = u.id WHERE u.id = $1',
      [user.id]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const gradeId = studentResult.rows[0].current_grade_id;

    // Await params for Next.js 15 compatibility
    const paramsObj = await params;
    const examId = paramsObj.examId;

    if (!examId) {
      return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });
    }

    // Get exam details
    const examResult = await query(`
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
        ae.published_at
      FROM admin_exams ae
      JOIN grades g ON ae.grade_id = g.id
      WHERE ae.id = $1
        AND ae.grade_id = $2
    `, [examId, gradeId]);

    if (examResult.rows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json({ exam: examResult.rows[0] });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}