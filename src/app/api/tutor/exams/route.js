// ============================================
// FILE: app/api/tutor/exams/route.js
// ============================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';

export async function GET() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
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
      FROM admin_exams ae
      JOIN grades g ON ae.grade_id = g.id
      JOIN admin_exam_subjects aes ON ae.id = aes.admin_exam_id
      JOIN tutor_subjects ts ON aes.subject_id = ts.subject_id
      WHERE ts.tutor_id = $1
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
            COUNT(DISTINCT aer.id) as student_count
          FROM admin_exam_subjects aes
          JOIN tutor_subjects ts ON aes.subject_id = ts.subject_id
          JOIN admin_exam_registrations aer ON aes.admin_exam_id = aer.admin_exam_id
          JOIN admin_exam_student_choices aesc ON aer.id = aesc.registration_id AND aes.subject_id = aesc.subject_id
          JOIN subjects sub ON aes.subject_id = sub.id
          WHERE aes.admin_exam_id = $1 
            AND ts.tutor_id = $2
            AND aer.status = 'confirmed'
          GROUP BY sub.id, sub.name
        `, [exam.id, tutorId]);

        console.log(`Counts for exam ${exam.id}:`, countsResult.rows);  // Debug

        return {
          ...exam,
          student_count_per_subject: Object.fromEntries(
            countsResult.rows.map(row => [row.subject_name, parseInt(row.student_count)])
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