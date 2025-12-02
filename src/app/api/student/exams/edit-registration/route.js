// ============================================
// FILE: app/api/student/exams/edit-registration/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';
import { cookies } from 'next/headers';

export async function POST(request) {
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

    // Get student ID
    const studentResult = await query('SELECT id FROM students s JOIN users u ON s.user_id = u.id WHERE u.id = $1', [user.id]);
    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const studentId = studentResult.rows[0].id;

    const body = await request.json();
    const { registration_id, subject_ids } = body;

    if (!registration_id || !subject_ids || subject_ids.length === 0) {
      return NextResponse.json({ error: 'Registration ID and subjects required' }, { status: 400 });
    }

    // Check if registration belongs to student
    const regCheck = await query('SELECT admin_exam_id FROM admin_exam_registrations WHERE id = $1 AND student_id = $2', [registration_id, studentId]);
    if (regCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const examId = regCheck.rows[0].admin_exam_id;

    // Delete old choices
    await query('DELETE FROM admin_exam_student_choices WHERE registration_id = $1', [registration_id]);

    // Insert new choices
    for (const subjectId of subject_ids) {
      // Validate subject is in exam
      const subjectInExam = await query('SELECT id FROM admin_exam_subjects WHERE admin_exam_id = $1 AND subject_id = $2', [examId, subjectId]);
      if (subjectInExam.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid subject for this exam' }, { status: 400 });
      }
      await query(
        'INSERT INTO admin_exam_student_choices (registration_id, subject_id) VALUES ($1, $2)',
        [registration_id, subjectId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editing registration:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}