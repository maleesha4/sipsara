// ============================================
// FILE: src/app/api/admin/reports/student-performance/[studentId]/route.js
// ============================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student info
    const studentResult = await query(
      `SELECT s.*, u.full_name, u.email
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [params.studentId]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get overall stats
    const statsResult = await query(
      `SELECT 
         COUNT(DISTINCT er.exam_id) as total_exams,
         ROUND(AVG(ov.percentage), 2) as avg_percentage,
         ROUND(AVG(ov.overall_rank), 0) as avg_rank
       FROM exam_registrations er
       LEFT JOIN overall_results ov ON er.id = ov.registration_id
       WHERE er.student_id = $1 AND ov.id IS NOT NULL`,
      [params.studentId]
    );

    // Get exam history with results
    const examsResult = await query(
      `SELECT 
         e.exam_name,
         e.exam_date,
         ov.total_marks,
         ov.percentage,
         ov.overall_rank,
         ov.result_status
       FROM exam_registrations er
       JOIN exams e ON er.exam_id = e.id
       LEFT JOIN overall_results ov ON er.id = ov.registration_id
       WHERE er.student_id = $1 AND e.results_published = true
       ORDER BY e.exam_date DESC`,
      [params.studentId]
    );

    // Get subject results for each exam
    const examsWithSubjects = await Promise.all(
      examsResult.rows.map(async (exam) => {
        const subjectsResult = await query(
          `SELECT 
             s.subject_name,
             r.marks_obtained,
             es.max_marks,
             r.grade
           FROM results r
           JOIN exam_subjects es ON r.exam_subject_id = es.id
           JOIN subjects s ON es.subject_id = s.id
           JOIN exam_registrations er ON r.registration_id = er.id
           JOIN exams e ON er.exam_id = e.id
           WHERE er.student_id = $1 AND e.exam_name = $2
           ORDER BY s.subject_name`,
          [params.studentId, exam.exam_name]
        );
        
        return {
          ...exam,
          subject_results: subjectsResult.rows
        };
      })
    );

    // Get subject-wise averages
    const subjectAvgResult = await query(
      `SELECT 
         s.subject_name,
         ROUND(AVG(r.marks_obtained), 2) as avg_marks,
         ROUND(AVG(es.max_marks), 2) as avg_max_marks,
         ROUND(AVG((r.marks_obtained / es.max_marks * 100)), 2) as avg_percentage
       FROM results r
       JOIN exam_subjects es ON r.exam_subject_id = es.id
       JOIN subjects s ON es.subject_id = s.id
       JOIN exam_registrations er ON r.registration_id = er.id
       WHERE er.student_id = $1
       GROUP BY s.id, s.subject_name
       ORDER BY s.subject_name`,
      [params.studentId]
    );

    return NextResponse.json({
      student: studentResult.rows[0],
      stats: statsResult.rows[0],
      exams: examsWithSubjects,
      subject_averages: subjectAvgResult.rows
    });

  } catch (error) {
    console.error('Error fetching student performance:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
