// ============================================
// FILE: app/api/tutor/stats/route.js
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
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tutor ID
    const tutorResult = await query(
      'SELECT id FROM tutors WHERE user_id = $1',
      [decoded.id]
    );

    if (tutorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
    }

    const tutorId = tutorResult.rows[0].id;

    // My Subjects
    const subjectsRes = await query(
      'SELECT s.id, s.name FROM subjects s JOIN tutor_subjects ts ON s.id = ts.subject_id WHERE ts.tutor_id = $1',
      [tutorId]
    );
    const mySubjects = subjectsRes.rows;

    // Active Exams (simplified: tutor-subject exams)
    const activeExamsRes = await query(
      `SELECT COUNT(DISTINCT ae.id) as count 
       FROM admin_exams ae
       JOIN admin_exam_subjects aes ON ae.id = aes.admin_exam_id
       JOIN tutor_subjects ts ON aes.subject_id = ts.subject_id
       WHERE ts.tutor_id = $1 AND ae.status IN ('registration_open', 'in_progress')`,
      [tutorId]
    );
    const activeExams = parseInt(activeExamsRes.rows[0]?.count || 0);

    // Total Papers
    const papersRes = await query('SELECT COUNT(*) as count FROM question_papers WHERE uploaded_by = $1', [decoded.id]);
    const totalPapers = parseInt(papersRes.rows[0]?.count || 0);

    // Student Counts per Grade (enrollments only, simplified)
    const studentCountsRes = await query(
      `SELECT g.year, COUNT(DISTINCT st.id) as count 
       FROM students st
       JOIN grades g ON st.current_grade_id = g.id
       JOIN tutor_students tsp ON st.id = tsp.student_id
       WHERE tsp.tutor_id = $1
       GROUP BY g.year 
       ORDER BY g.year`,
      [tutorId]
    );
    const studentCounts = {};
    studentCountsRes.rows.forEach(row => {
      studentCounts[row.year] = parseInt(row.count);
    });

    const stats = {
      mySubjects,
      activeExams,
      totalPapers,
      studentCounts
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching tutor stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}