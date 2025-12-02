import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    const user = verifyToken(token);

    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify registration belongs to student
    const regCheck = await query(
      `SELECT er.exam_id, e.exam_name FROM exam_registrations er
       JOIN students s ON er.student_id = s.id
       JOIN exams e ON er.exam_id = e.id
       WHERE er.id = $1 AND s.user_id = $2`,
      [params.registrationId, user.id]
    );

    if (regCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const examId = regCheck.rows[0].exam_id;
    const examName = regCheck.rows[0].exam_name;

    // Get papers for this exam
    const papersResult = await query(
      `SELECT p.*, s.subject_name, s.subject_name_si
       FROM papers p
       JOIN exam_subjects es ON p.exam_subject_id = es.id
       JOIN subjects s ON es.subject_id = s.id
       WHERE es.exam_id = $1 AND p.is_visible_to_students = true
       ORDER BY s.subject_name, p.paper_type`,
      [examId]
    );

    return NextResponse.json({
      examInfo: { exam_name: examName },
      papers: papersResult.rows
    });

  } catch (error) {
    console.error('Error fetching papers:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}