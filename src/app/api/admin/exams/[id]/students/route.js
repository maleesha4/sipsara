// ============================================
// FILE: app/api/admin/exams/[id]/students/route.js
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

    const { id } = await params;
    const examId = parseInt(id);

    // First verify the exam exists
    const examCheck = await query(
      'SELECT ae.id FROM admin_exams ae WHERE ae.id = $1',
      [examId]
    );

    if (examCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Get all registrations for this exam with student details (INNER JOIN as in /registrations)
    const result = await query(`
      SELECT 
        aer.id,
        aer.admin_exam_id,
        aer.admission_number,
        aer.registration_date,
        aer.status,
        u.full_name as student_name,
        u.email as student_email,
        s.id as student_id
      FROM admin_exam_registrations aer
      INNER JOIN students s ON aer.student_id = s.id
      INNER JOIN users u ON s.user_id = u.id
      WHERE aer.admin_exam_id = $1
      ORDER BY aer.registration_date DESC
    `, [examId]);

    // For each registration, get the selected subjects
    const registrationsWithSubjects = await Promise.all(
      result.rows.map(async (reg) => {
        const subjectsResult = await query(`
          SELECT 
            aesc.id as choice_id,
            sub.id as subject_id,
            sub.name as subject_name
          FROM admin_exam_student_choices aesc
          JOIN subjects sub ON aesc.subject_id = sub.id
          WHERE aesc.registration_id = $1
          ORDER BY sub.name ASC
        `, [reg.id]);

        return {
          ...reg,
          index_number: null,  // Removed to avoid column error
          chosen_subjects: subjectsResult.rows.map(s => s.subject_name).join(', '),
          subject_ids: subjectsResult.rows.map(s => s.subject_id),
          choice_ids: subjectsResult.rows.map(s => s.choice_id)
        };
      })
    );

    return NextResponse.json({ registrations: registrationsWithSubjects });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}