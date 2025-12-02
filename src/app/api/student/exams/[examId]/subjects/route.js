// ============================================
// FILE: app/api/student/exams/[examId]/subjects/route.js
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

    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paramsObj = await params;
    const examId = paramsObj?.examId;

    if (!examId) {
      return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });
    }

    // Get student's current grade
    const studentResult = await query('SELECT current_grade_id FROM students s JOIN users u ON s.user_id = u.id WHERE u.id = $1', [user.id]);
    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const gradeId = studentResult.rows[0].current_grade_id;

    // Check if exam matches student's grade
    const examCheck = await query('SELECT id FROM admin_exams WHERE id = $1 AND grade_id = $2', [examId, gradeId]);
    if (examCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Exam not for your grade' }, { status: 403 });
    }

    // Get subjects for the exam
    const result = await query(`
      SELECT 
        s.id,
        s.name
      FROM admin_exam_subjects aes
      JOIN subjects s ON aes.subject_id = s.id
      WHERE aes.admin_exam_id = $1
      ORDER BY s.name ASC
    `, [examId]);

    return NextResponse.json({ subjects: result.rows });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}