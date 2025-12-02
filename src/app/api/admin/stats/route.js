// ============================================
// FILE: src/app/api/admin/stats/route.js
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

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get statistics with parallel queries
    const [studentsRes, tutorsRes, examsRes, activeExamsRes, pendingRegsRes] = await Promise.all([
      query(`
        SELECT 
          COALESCE(SUM(CASE WHEN g.year = 6 THEN 1 ELSE 0 END), 0) as grade6,
          COALESCE(SUM(CASE WHEN g.year = 7 THEN 1 ELSE 0 END), 0) as grade7,
          COALESCE(SUM(CASE WHEN g.year = 8 THEN 1 ELSE 0 END), 0) as grade8,
          COALESCE(SUM(CASE WHEN g.year = 9 THEN 1 ELSE 0 END), 0) as grade9,
          COALESCE(SUM(CASE WHEN g.year = 10 THEN 1 ELSE 0 END), 0) as grade10,
          COALESCE(SUM(CASE WHEN g.year = 11 THEN 1 ELSE 0 END), 0) as grade11
        FROM students s 
        LEFT JOIN grades g ON s.current_grade_id = g.id
      `),
      query('SELECT COUNT(*) as count FROM tutors'),
      query('SELECT COUNT(*) as count FROM admin_exams'),
      query("SELECT COUNT(*) as count FROM admin_exams WHERE status IN ('registration_open', 'in_progress')"),
      query("SELECT COUNT(*) as count FROM admin_exam_registrations WHERE status = 'registered'")
    ]);

    return NextResponse.json({
      stats: {
        totalStudents: studentsRes.rows[0],
        totalTutors: parseInt(tutorsRes.rows[0].count),
        totalExams: parseInt(examsRes.rows[0].count),
        activeExams: parseInt(activeExamsRes.rows[0].count),
        pendingRegistrations: parseInt(pendingRegsRes.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}