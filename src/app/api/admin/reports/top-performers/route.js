// ============================================
// FILE: src/app/api/admin/reports/top-performers/route.js
// ============================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    let performers;

    if (examId === 'all') {
      // Overall top performers across all exams
      performers = await query(
        `SELECT 
           s.index_number,
           u.full_name,
           COUNT(DISTINCT er.exam_id) as exam_count,
           ROUND(AVG(ov.percentage), 2) as avg_percentage,
           SUM(ov.total_marks) as total_marks
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN exam_registrations er ON s.id = er.student_id
         JOIN overall_results ov ON er.id = ov.registration_id
         GROUP BY s.id, s.index_number, u.full_name
         ORDER BY avg_percentage DESC, total_marks DESC
         LIMIT 50`
      );
    } else {
      // Top performers for specific exam
      performers = await query(
        `SELECT 
           s.index_number,
           u.full_name,
           ov.total_marks,
           ov.percentage as avg_percentage,
           ov.overall_rank
         FROM exam_registrations er
         JOIN students s ON er.student_id = s.id
         JOIN users u ON s.user_id = u.id
         JOIN overall_results ov ON er.id = ov.registration_id
         WHERE er.exam_id = $1
         ORDER BY ov.overall_rank ASC
         LIMIT 50`,
        [examId]
      );
    }

    return NextResponse.json({ performers: performers.rows });

  } catch (error) {
    console.error('Error fetching top performers:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}