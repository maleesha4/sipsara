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

    // Verify registration and check if results published
    const regCheck = await query(
      `SELECT er.id, e.exam_name, e.results_published
       FROM exam_registrations er
       JOIN students s ON er.student_id = s.id
       JOIN exams e ON er.exam_id = e.id
       WHERE er.id = $1 AND s.user_id = $2`,
      [params.registrationId, user.id]
    );

    if (regCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (!regCheck.rows[0].results_published) {
      return NextResponse.json({ error: 'Results not published yet' }, { status: 403 });
    }

    // Get subject-wise results
    const resultsQuery = await query(
      `SELECT r.*, s.subject_name, s.subject_name_si, es.max_marks
       FROM results r
       JOIN exam_subjects es ON r.exam_subject_id = es.id
       JOIN subjects s ON es.subject_id = s.id
       WHERE r.registration_id = $1 AND r.verified = true
       ORDER BY s.subject_name`,
      [params.registrationId]
    );

    // Get overall results
    const overallQuery = await query(
      'SELECT * FROM overall_results WHERE registration_id = $1',
      [params.registrationId]
    );

    return NextResponse.json({
      examInfo: { exam_name: regCheck.rows[0].exam_name },
      results: resultsQuery.rows,
      overall: overallQuery.rows[0] || null
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
