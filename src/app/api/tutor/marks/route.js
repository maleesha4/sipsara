// ============================================
// FILE: app/api/tutor/marks/route.js
// ============================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const examId = url.searchParams.get('examId');

    // Get tutor ID
    const tutorResult = await query(
      'SELECT id FROM tutors WHERE user_id = $1',
      [decoded.id]
    );

    if (tutorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
    }

    const tutorId = tutorResult.rows[0].id;

    let whereClause = 'WHERE aest.tutor_id = $1';
    const params = [tutorId];

    if (examId) {
      whereClause += ' AND aest.admin_exam_id = $2';
      params.push(examId);
    }

    // Fetch choices assigned to tutor, with student details and current marks
    const result = await query(`
      SELECT 
        aesc.id as choice_id,
        aer.id as registration_id,
        u.full_name as student_name,
        aer.admission_number,
        sub.name as subject_name,
        aem.score,
        aem.marked_at
      FROM admin_exam_subject_tutors aest
      JOIN admin_exam_student_choices aesc ON aesc.subject_id = aest.subject_id
      JOIN admin_exam_registrations aer ON aesc.registration_id = aer.id
      JOIN students s ON aer.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN subjects sub ON aesc.subject_id = sub.id
      LEFT JOIN admin_exam_marks aem ON aesc.id = aem.choice_id AND aem.tutor_id = $1
      ${whereClause}
        AND aer.status IN ('registered', 'confirmed')
      ORDER BY u.full_name ASC, sub.name ASC
    `, params);

    return NextResponse.json({ choices: result.rows });
  } catch (error) {
    console.error('Error fetching marks:', error);
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { choiceId, score } = body;

    if (!choiceId || score === undefined || score < 0 || score > 100) {
      return NextResponse.json({ error: 'Invalid input: choiceId and score (0-100) required' }, { status: 400 });
    }

    const parsedScore = parseInt(score);
    if (isNaN(parsedScore)) {
      return NextResponse.json({ error: 'Score must be a valid number' }, { status: 400 });
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

    // Upsert mark for choice
    await query(`
      INSERT INTO admin_exam_marks (choice_id, tutor_id, score)
      VALUES ($1, $2, $3)
      ON CONFLICT (choice_id, tutor_id) DO UPDATE SET
        score = EXCLUDED.score, 
        marked_at = CURRENT_TIMESTAMP
    `, [choiceId, tutorId, parsedScore]);

    return NextResponse.json({ message: 'Mark saved successfully' });
  } catch (error) {
    console.error('Error saving mark:', error);
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
  }
}