// ============================================
// FILE: app/api/tutor/exams/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = verifyToken(token);

    if (!user || user.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Tutor user ID:', user.id);  // Debug

    // Get tutor ID
    const tutorResult = await query(
      'SELECT id FROM tutors WHERE user_id = $1',
      [user.id]
    );

    if (tutorResult.rows.length === 0) {
      console.log('No tutor profile for user ID:', user.id);  // Debug
      return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
    }

    const tutorId = tutorResult.rows[0].id;
    console.log('Tutor ID:', tutorId);  // Debug

    // Fetch recent active admin_exams assigned to tutor
    const examsResult = await query(`
      SELECT DISTINCT
        ae.id,
        ae.exam_name,
        ae.exam_date,
        ae.status,
        g.grade_name
      FROM admin_exam_subject_tutors aest
      JOIN admin_exams ae ON aest.admin_exam_id = ae.id
      JOIN grades g ON ae.grade_id = g.id
      WHERE aest.tutor_id = $1
        AND ae.status IN ('registration_open', 'in_progress', 'completed')
      ORDER BY ae.exam_date DESC
      LIMIT 5
    `, [tutorId]);

    console.log('Exams query rows:', examsResult.rows.length);  // Debug
    console.log('Exams rows:', examsResult.rows);  // Debug

    // For each exam, fetch student count per tutor's subject
    const examsWithCounts = await Promise.all(
      examsResult.rows.map(async (exam) => {
        const countsResult = await query(`
          SELECT 
            sub.name as subject_name,
            COUNT(DISTINCT aesc.registration_id) as student_count
          FROM admin_exam_subject_tutors aest
          JOIN admin_exam_student_choices aesc ON aesc.subject_id = aest.subject_id
          JOIN admin_exam_registrations aer ON aesc.registration_id = aer.id
          JOIN subjects sub ON aesc.subject_id = sub.id
          WHERE aest.admin_exam_id = $1 
            AND aest.tutor_id = $2
            AND aer.status = 'confirmed'
          GROUP BY sub.id, sub.name
        `, [exam.id, tutorId]);

        console.log(`Counts for exam ${exam.id}:`, countsResult.rows);  // Debug

        return {
          ...exam,
          student_count_per_subject: Object.fromEntries(
            countsResult.rows.map(row => [row.subject_name, row.student_count])
          )
        };
      })
    );

    return NextResponse.json({ exams: examsWithCounts });
  } catch (error) {
    console.error('Error fetching tutor exams:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}