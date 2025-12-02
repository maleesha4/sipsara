// ============================================
// FILE: app/api/admin/exams/route.js
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
    console.log('Exams API - Decoded user:', user ? { id: user.id, role: user.role } : 'null'); // Debug log

    if (!user || user.role !== 'admin') {
      console.log('Unauthorized access to exams list');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        ae.id,
        ae.exam_name,
        ae.exam_date,
        ae.registration_start_date,
        ae.registration_end_date,
        ae.status,
        ae.description,
        ae.published_at,
        ae.created_at,
        g.grade_name,
        COUNT(aer.id) as registration_count
      FROM admin_exams ae
      LEFT JOIN grades g ON ae.grade_id = g.id
      LEFT JOIN admin_exam_registrations aer ON ae.id = aer.admin_exam_id
      GROUP BY ae.id, g.grade_name
      ORDER BY ae.created_at DESC
    `);

    console.log('Exams fetched:', result.rows.length); // Debug log
    return NextResponse.json({ exams: result.rows });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = verifyToken(token);
    console.log('Exams POST - Decoded user:', user ? { id: user.id, role: user.role } : 'null'); // Debug log

    if (!user || user.role !== 'admin') {
      console.log('Unauthorized access to create exam');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exam_name, grade_ids, exam_date, registration_start_date, registration_end_date, description, subject_ids, status } = body;
    
    // Validation
    const startDate = new Date(registration_start_date);
    const endDate = new Date(registration_end_date);
    const examD = new Date(exam_date);

    if (endDate <= startDate || examD <= endDate) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }

    if (!grade_ids || grade_ids.length === 0 || !subject_ids || subject_ids.length === 0) {
      return NextResponse.json({ error: 'Grades and subjects required' }, { status: 400 });
    }

    // Get admin ID from admins table
    const adminResult = await query('SELECT id FROM admins WHERE user_id = $1', [user.id]);
    if (adminResult.rows.length === 0) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 400 });
    }
    const adminId = adminResult.rows[0].id;

    // Insert exam (use first grade_id)
    const examResult = await query(
      `INSERT INTO admin_exams 
        (exam_name, grade_id, exam_date, registration_start_date, registration_end_date, description, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [exam_name, parseInt(grade_ids[0]), exam_date, registration_start_date, registration_end_date, description, status || 'draft', adminId]
    );

    const examId = examResult.rows[0].id;

    // Insert subjects (your schema uses admin_exam_subjects)
    for (const subjectId of subject_ids) {
      await query(
        `INSERT INTO admin_exam_subjects (admin_exam_id, subject_id) 
         VALUES ($1, $2) 
         ON CONFLICT (admin_exam_id, subject_id) DO NOTHING`,
        [examId, parseInt(subjectId)]
      );
    }

    return NextResponse.json({ id: examId, success: true }, { status: 201 });
  } catch (error) {
    console.error('Insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}