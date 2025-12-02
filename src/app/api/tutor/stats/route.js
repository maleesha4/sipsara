// ============================================
// FILE: app/api/tutor/stats/route.js
// ============================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
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
      'SELECT s.id, s.name FROM subjects s JOIN tutors t ON s.id = t.subject_id WHERE t.id = $1',
      [tutorId]
    );
    const mySubjects = subjectsRes.rows;

    // Active Exams (simplified: tutor-subject exams)
    const activeExamsRes = await query(
      'SELECT COUNT(*) as count FROM exams e JOIN tutors t ON t.subject_id = e.subject_id WHERE t.id = $1 AND e.status = \'active\'',
      [tutorId]
    );
    const activeExams = activeExamsRes.rows[0]?.count || 0;

    // Total Papers
    const papersRes = await query('SELECT COUNT(*) as count FROM papers WHERE tutor_id = $1', [tutorId]);
    const totalPapers = papersRes.rows[0]?.count || 0;

    // Student Counts per Grade (enrollments only, simplified)
    const studentCountsRes = await query(
      'SELECT g.year, COUNT(DISTINCT e.student_id) as count FROM enrollments e JOIN grades g ON e.grade_id = g.id WHERE e.tutor_id = $1 AND e.status = \'active\' GROUP BY g.year ORDER BY g.year',
      [tutorId]
    );
    const studentCounts = {};
    studentCountsRes.rows.forEach(row => {
      studentCounts[row.year] = row.count;
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