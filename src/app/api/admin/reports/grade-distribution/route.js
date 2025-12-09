// ============================================
// FILE: app/api/admin/reports/grade-distribution/route.js (UPDATED - Fixed grade scale to A,B,C,S,W; fixed grouping and ordering for grades; fixed combination string_agg order)
// ============================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyToken } from '../../../../../lib/auth';
import { query } from '../../../../../lib/database';

export async function GET(request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const examId = parseInt(searchParams.get('examId'));
    if (!examId) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 });
    }

    // Total students
    const totalStudentsResult = await query(
      'SELECT COUNT(*) as total FROM admin_exam_registrations WHERE admin_exam_id = $1 AND status IN (\'registered\', \'confirmed\')',
      [examId]
    );
    const total = parseInt(totalStudentsResult.rows[0].total);

    // Overall grade distribution using CTE
    const distributionResult = await query(`
      WITH student_averages AS (
        SELECT
          aer.id as registration_id,
          AVG(aem.score) as average
        FROM admin_exam_registrations aer
        LEFT JOIN admin_exam_student_choices aesc ON aesc.registration_id = aer.id
        LEFT JOIN admin_exam_marks aem ON aem.choice_id = aesc.id
        WHERE aer.admin_exam_id = $1
          AND aer.status IN ('registered', 'confirmed')
        GROUP BY aer.id
      )
      SELECT
        CASE
          WHEN sa.average >= 90 THEN 'A'
          WHEN sa.average >= 80 THEN 'B'
          WHEN sa.average >= 70 THEN 'C'
          WHEN sa.average >= 60 THEN 'S'
          ELSE 'W'
        END as grade,
        COUNT(*) as count
      FROM admin_exam_registrations aer
      JOIN student_averages sa ON aer.id = sa.registration_id
      WHERE aer.admin_exam_id = $1
        AND aer.status IN ('registered', 'confirmed')
        AND sa.average IS NOT NULL
      GROUP BY CASE
        WHEN sa.average >= 90 THEN 'A'
        WHEN sa.average >= 80 THEN 'B'
        WHEN sa.average >= 70 THEN 'C'
        WHEN sa.average >= 60 THEN 'S'
        ELSE 'W'
      END
      ORDER BY grade ASC
    `, [examId]);
    const distribution = distributionResult.rows.map(row => ({
      ...row,
      percentage: ((row.count / total) * 100).toFixed(2)
    }));

    // Subject-wise grade distribution
    const subjectGradesResult = await query(`
      SELECT
        s.name as subject_name,
        CASE
          WHEN aem.score >= 90 THEN 'A'
          WHEN aem.score >= 80 THEN 'B'
          WHEN aem.score >= 70 THEN 'C'
          WHEN aem.score >= 60 THEN 'S'
          ELSE 'W'
        END as grade,
        COUNT(*) as count
      FROM admin_exam_marks aem
      JOIN admin_exam_student_choices aesc ON aem.choice_id = aesc.id
      JOIN subjects s ON aesc.subject_id = s.id
      JOIN admin_exam_registrations aer ON aesc.registration_id = aer.id
      WHERE aer.admin_exam_id = $1
        AND aer.status IN ('registered', 'confirmed')
        AND aem.score IS NOT NULL
      GROUP BY s.name, CASE
        WHEN aem.score >= 90 THEN 'A'
        WHEN aem.score >= 80 THEN 'B'
        WHEN aem.score >= 70 THEN 'C'
        WHEN aem.score >= 60 THEN 'S'
        ELSE 'W'
      END
      ORDER BY s.name, grade ASC
    `, [examId]);

    // Group by subject
    const subjectDistribution = {};
    subjectGradesResult.rows.forEach(row => {
      if (!subjectDistribution[row.subject_name]) {
        subjectDistribution[row.subject_name] = {};
      }
      subjectDistribution[row.subject_name][row.grade] = row.count;
    });

    // Grade combinations using CTE for per-student grade counts
    const combinationsResult = await query(`
      WITH student_grades AS (
        SELECT
          aer.id as registration_id,
          u.full_name as student_name,
          CASE
            WHEN aem.score >= 90 THEN 'A'
            WHEN aem.score >= 80 THEN 'B'
            WHEN aem.score >= 70 THEN 'C'
            WHEN aem.score >= 60 THEN 'S'
            ELSE 'W'
          END as grade
        FROM admin_exam_registrations aer
        JOIN students s ON aer.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN admin_exam_student_choices aesc ON aesc.registration_id = aer.id
        LEFT JOIN admin_exam_marks aem ON aem.choice_id = aesc.id
        WHERE aer.admin_exam_id = $1
          AND aer.status IN ('registered', 'confirmed')
          AND aem.score IS NOT NULL
      ),
      grade_counts AS (
        SELECT
          registration_id,
          student_name,
          grade,
          COUNT(*) as count
        FROM student_grades
        GROUP BY registration_id, student_name, grade
      )
      SELECT
        student_name,
        string_agg(grade || ':' || count, ', ' ORDER BY grade ASC) as combination
      FROM grade_counts
      GROUP BY registration_id, student_name
      ORDER BY student_name
    `, [examId]);

    // Group by combination
    const combinations = {};
    combinationsResult.rows.forEach(row => {
      const key = row.combination;
      if (!combinations[key]) {
        combinations[key] = { count: 0, students: [] };
      }
      combinations[key].count++;
      combinations[key].students.push(row.student_name);
    });

    // Top combinations
    const topCombinations = Object.entries(combinations)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([key, data]) => ({ combination: key, ...data }));

    return NextResponse.json({
      distribution,
      subjectDistribution,
      topCombinations,
      total
    });
  } catch (error) {
    console.error('Error fetching grade distribution:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}