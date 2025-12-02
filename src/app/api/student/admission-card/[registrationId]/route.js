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

    // Get registration details
    const regResult = await query(
      `SELECT er.*, e.*, u.full_name, s.index_number
       FROM exam_registrations er
       JOIN exams e ON er.exam_id = e.id
       JOIN students s ON er.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE er.id = $1 AND u.id = $2 AND e.admission_card_released = true`,
      [params.registrationId, user.id]
    );

    if (regResult.rows.length === 0) {
      return NextResponse.json({ error: 'Admission card not available' }, { status: 404 });
    }

    const data = regResult.rows[0];

    // Get exam schedule
    const scheduleResult = await query(
      `SELECT es.*, s.subject_name, s.subject_name_si
       FROM exam_schedule es
       JOIN subjects s ON es.subject_id = s.id
       WHERE es.exam_id = $1
       ORDER BY es.exam_date, es.start_time`,
      [data.exam_id]
    );

    return NextResponse.json({
      registration: {
        admission_card_number: data.admission_card_number,
        registration_date: data.registration_date
      },
      exam: {
        exam_name: data.exam_name,
        exam_date: data.exam_date,
        exam_type: data.exam_type,
        exam_code: data.exam_code
      },
      student: {
        full_name: data.full_name,
        index_number: data.index_number
      },
      schedule: scheduleResult.rows
    });

  } catch (error) {
    console.error('Error fetching admission card:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

