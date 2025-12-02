// ============================================
// FILE: app/api/student/registrations/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';
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

    // Get student ID - Fix ambiguous id
    const studentResult = await query(
      'SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.id = $1',
      [user.id]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json({ registrations: [] });
    }

    const studentId = studentResult.rows[0].id;

    // Get registrations with exam details - FIX: Specify table aliases for all columns
    const regsResult = await query(`
      SELECT 
        aer.id,
        aer.admin_exam_id,
        aer.status,
        aer.admission_number,
        ae.exam_name,
        ae.exam_date,
        ae.published_at,
        STRING_AGG(s.name, ', ') as chosen_subjects
      FROM admin_exam_registrations aer
      JOIN admin_exams ae ON aer.admin_exam_id = ae.id
      LEFT JOIN admin_exam_student_choices aesc ON aer.id = aesc.registration_id
      LEFT JOIN subjects s ON aesc.subject_id = s.id
      WHERE aer.student_id = $1
      GROUP BY aer.id, ae.id, ae.exam_name, ae.exam_date, ae.published_at
      ORDER BY ae.exam_date DESC
    `, [studentId]);

    return NextResponse.json({ registrations: regsResult.rows });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}