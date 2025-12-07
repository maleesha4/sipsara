// ============================================
// FILE: app/api/student/exams/[examId]/route.js (UPDATED - Returns subject schedule)
// ============================================
import { NextResponse } from 'next/headers';
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

    // Get student ID and grade
    const studentResult = await query(
      'SELECT s.id, s.current_grade_id FROM students s JOIN users u ON s.user_id = u.id WHERE u.id = $1',
      [user.id]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentId = studentResult.rows[0].id;
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

    const exam = examResult.rows[0];

    // Check if student is registered for this exam
    const registrationResult = await query(`
      SELECT 
        aer.id as registration_id,
        aer.admission_number,
        aer.registration_date,
        aer.status,
        u.full_name as student_name,
        u.email as student_email
      FROM admin_exam_registrations aer
      JOIN students s ON aer.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE aer.admin_exam_id = $1 AND aer.student_id = $2
    `, [examId, studentId]);

    let registration = null;
    let subject_schedule = [];

    if (registrationResult.rows.length > 0) {
      registration = registrationResult.rows[0];

      // Get subject schedule with dates and times
      const subjectsResult = await query(`
        SELECT 
          s.id as subject_id,
          s.name as subject_name,
          aes.exam_date,
          aes.start_time,
          aes.end_time
        FROM admin_exam_student_choices aesc
        JOIN subjects s ON aesc.subject_id = s.id
        JOIN admin_exam_subjects aes ON aes.admin_exam_id = $1 AND aes.subject_id = s.id
        WHERE aesc.registration_id = $2
        ORDER BY aes.exam_date, aes.start_time
      `, [examId, registration.registration_id]);

      subject_schedule = subjectsResult.rows;

      // Add subject schedule to registration object
      registration.subject_schedule = subject_schedule;
      registration.exam_name = exam.exam_name;
      registration.grade_name = exam.grade_name;
      registration.exam_date = exam.exam_date;
    }

    return NextResponse.json({ 
      exam: exam,
      registration: registration,
      is_registered: registration !== null
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}