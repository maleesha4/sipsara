// ============================================
// FILE: app/api/admin/exams/[id]/available-students/route.js (NEW)
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../../../lib/auth';
import { query } from '../../../../../../lib/database';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = parseInt(params.id);

    // First, get the grade_id for this exam
    const examResult = await query(
      'SELECT grade_id FROM admin_exams WHERE id = $1',
      [examId]
    );

    if (examResult.rows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const gradeId = examResult.rows[0].grade_id;

    // Fetch students in this grade who are NOT registered for this exam
    const result = await query(
      `
      SELECT
        s.id AS student_id,
        u.full_name AS student_name,
        u.email AS student_email
      FROM students s
      INNER JOIN users u ON s.user_id = u.id
      WHERE s.current_grade_id = $1
        AND s.id NOT IN (
          SELECT aer.student_id 
          FROM admin_exam_registrations aer 
          WHERE aer.admin_exam_id = $2
        )
      ORDER BY u.full_name ASC
      `,
      [gradeId, examId]
    );

    return NextResponse.json({ available_students: result.rows });
  } catch (error) {
    console.error('Error fetching available students:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}