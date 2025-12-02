// ============================================
// FILE: app/api/student/exams/register/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { query } from '../../../../../lib/database';
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

    // Get student ID - Fix ambiguous id column reference
    const studentResult = await query(
      'SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.id = $1', 
      [user.id]
    );
    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const studentId = studentResult.rows[0].id;

    const body = await request.json();
    const { exam_id, subject_ids } = body;

    if (!exam_id || !subject_ids || subject_ids.length === 0) {
      return NextResponse.json({ error: 'Exam ID and subjects required' }, { status: 400 });
    }

    // Check if registration is open - Fix ambiguous id column reference
    const examCheck = await query(`
      SELECT 
        ae.registration_start_date,
        ae.registration_end_date,
        ae.status,
        ae.grade_id
      FROM admin_exams ae
      WHERE ae.id = $1
    `, [exam_id]);

    if (examCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const exam = examCheck.rows[0];
    const now = new Date();
    if (exam.status !== 'registration_open' || now < new Date(exam.registration_start_date) || now > new Date(exam.registration_end_date)) {
      return NextResponse.json({ error: 'Registration is not open' }, { status: 403 });
    }

    // Check student's grade matches exam grade
    const studentGradeResult = await query('SELECT current_grade_id FROM students WHERE id = $1', [studentId]);
    if (studentGradeResult.rows[0].current_grade_id !== exam.grade_id) {
      return NextResponse.json({ error: 'Exam not for your grade' }, { status: 403 });
    }

    // Check if already registered - Fix ambiguous id column reference
    const existingReg = await query(
      'SELECT aer.id FROM admin_exam_registrations aer WHERE aer.admin_exam_id = $1 AND aer.student_id = $2', 
      [exam_id, studentId]
    );
    if (existingReg.rows.length > 0) {
      return NextResponse.json({ error: 'Already registered for this exam' }, { status: 409 });
    }

    // Create registration
    const admissionNumber = 25012300 + studentId;
    const regResult = await query(
      'INSERT INTO admin_exam_registrations (admin_exam_id, student_id, status, admission_number) VALUES ($1, $2, $3, $4) RETURNING id',
      [exam_id, studentId, 'registered', admissionNumber]
    );
    const regId = regResult.rows[0].id;

    // Create subject choices
    for (const subjectId of subject_ids) {
      // Validate subject is in exam
      const subjectInExam = await query(
        'SELECT aes.id FROM admin_exam_subjects aes WHERE aes.admin_exam_id = $1 AND aes.subject_id = $2', 
        [exam_id, subjectId]
      );
      if (subjectInExam.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid subject for this exam' }, { status: 400 });
      }
      await query(
        'INSERT INTO admin_exam_student_choices (registration_id, subject_id) VALUES ($1, $2)',
        [regId, subjectId]
      );
    }

    return NextResponse.json({ success: true, registration_id: regId, admission_number: admissionNumber });
  } catch (error) {
    console.error('Error registering for exam:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}