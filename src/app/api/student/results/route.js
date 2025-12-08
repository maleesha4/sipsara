// ============================================
// FILE: app/api/student/results/route.js (NEW FILE)
// ============================================
import { NextResponse } from 'next/server';
import { query } from '../../../../lib/database';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const admissionNumber = url.searchParams.get('admission');

    if (!admissionNumber) {
      return NextResponse.json({ error: 'Admission number is required' }, { status: 400 });
    }

    // Find registration with this admission number
    const registrationResult = await query(`
      SELECT 
        aer.id as registration_id,
        aer.admission_number,
        aer.student_id,
        u.full_name as student_name,
        ae.id as exam_id,
        ae.exam_name,
        ae.status as exam_status,
        ae.exam_date,
        g.grade_name
      FROM admin_exam_registrations aer
      JOIN students s ON aer.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN admin_exams ae ON aer.admin_exam_id = ae.id
      JOIN grades g ON ae.grade_id = g.id
      WHERE aer.admission_number = $1
    `, [admissionNumber.trim()]);

    if (registrationResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'No exam found with this admission number. Please check and try again.' 
      }, { status: 404 });
    }

    const registration = registrationResult.rows[0];

    // Check if results are published
    if (registration.exam_status !== 'published') {
      return NextResponse.json({ 
        error: 'Results for this exam have not been published yet. Please check back later.' 
      }, { status: 403 });
    }

    // Get all subject marks for this student
    const marksResult = await query(`
      SELECT 
        s.id as subject_id,
        s.name as subject_name,
        aem.score
      FROM admin_exam_student_choices aesc
      JOIN subjects s ON aesc.subject_id = s.id
      LEFT JOIN admin_exam_marks aem ON aesc.id = aem.choice_id
      WHERE aesc.registration_id = $1
      ORDER BY s.name
    `, [registration.registration_id]);

    const subjects = marksResult.rows;

    // Calculate total and average
    const validScores = subjects.filter(s => s.score !== null).map(s => s.score);
    const total = validScores.length > 0 ? validScores.reduce((sum, score) => sum + score, 0) : null;
    const average = validScores.length > 0 ? total / validScores.length : null;

    return NextResponse.json({
      results: {
        student_name: registration.student_name,
        admission_number: registration.admission_number,
        exam_name: registration.exam_name,
        grade_name: registration.grade_name,
        exam_date: registration.exam_date,
        subjects: subjects,
        total,
        average
      }
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch results. Please try again later.',
      details: error.message 
    }, { status: 500 });
  }
}