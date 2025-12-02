// ============================================
// FILE: src/app/api/admin/reports/subject-analysis/route.js
// ============================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT 
         s.subject_name,
         s.subject_code,
         COUNT(DISTINCT e.id) as exam_count,
         COUNT(DISTINCT r.id) as total_students,
         ROUND(AVG(r.marks_obtained), 2) as avg_marks,
         ROUND(AVG((r.marks_obtained / es.max_marks * 100)), 2) as avg_percentage,
         MAX(r.marks_obtained) as highest_marks,
         MIN(r.marks_obtained) as lowest_marks,
         COUNT(CASE WHEN r.marks_obtained >= es.pass_marks THEN 1 END) as pass_count,
         COUNT(CASE WHEN r.marks_obtained < es.pass_marks THEN 1 END) as fail_count,
         ROUND(
           (COUNT(CASE WHEN r.marks_obtained >= es.pass_marks THEN 1 END)::numeric / 
            COUNT(r.id)::numeric * 100), 2
         ) as pass_rate,
         COUNT(CASE WHEN r.grade = 'A' THEN 1 END) as grade_a_count,
         COUNT(CASE WHEN r.grade = 'B' THEN 1 END) as grade_b_count,
         COUNT(CASE WHEN r.grade = 'C' THEN 1 END) as grade_c_count,
         COUNT(CASE WHEN r.grade = 'S' THEN 1 END) as grade_s_count,
         COUNT(CASE WHEN r.grade = 'W' THEN 1 END) as grade_w_count
       FROM subjects s
       JOIN exam_subjects es ON s.id = es.subject_id
       JOIN exams e ON es.exam_id = e.id
       LEFT JOIN results r ON es.id = r.exam_subject_id AND r.verified = true
       WHERE e.results_published = true
       GROUP BY s.id, s.subject_name, s.subject_code
       HAVING COUNT(DISTINCT r.id) > 0
       ORDER BY avg_percentage DESC`
    );

    return NextResponse.json({ subjects: result.rows });

  } catch (error) {
    console.error('Error fetching subject analysis:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

