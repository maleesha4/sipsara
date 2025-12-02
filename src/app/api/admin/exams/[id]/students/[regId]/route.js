// ============================================
// FILE: app/api/admin/exams/[id]/students/[regId]/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../../../../lib/auth';
import { query } from '../../../../../../../lib/database';
import { cookies } from 'next/headers';

export async function PATCH(request, { params }) {
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

    const { regId } = await params;
    const registrationId = parseInt(regId);
    const body = await request.json();
    const { subject_ids } = body;

    if (!Array.isArray(subject_ids)) {
      return NextResponse.json({ error: 'Invalid request - subject_ids must be an array' }, { status: 400 });
    }

    // Verify registration exists
    const regCheck = await query(
      'SELECT id, student_id FROM admin_exam_registrations WHERE id = $1',
      [registrationId]
    );

    if (regCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const reg = regCheck.rows[0];
    const studentId = reg.student_id;

    // Delete old choices
    await query(
      'DELETE FROM admin_exam_student_choices WHERE registration_id = $1',
      [registrationId]
    );

    // Insert new choices
    for (const subjectId of subject_ids) {
      await query(
        'INSERT INTO admin_exam_student_choices (registration_id, subject_id) VALUES ($1, $2)',
        [registrationId, subjectId]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subjects updated successfully',
      student_id: studentId
    });
  } catch (error) {
    console.error('Error updating subjects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}