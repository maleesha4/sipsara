// app/api/tutor/enrollments/[id]/route.js (fixed import paths)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/auth';
import { query } from '../../../lib/database';

export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;  // enrollmentId

    // Get tutor_id to verify ownership
    const tutorRes = await query('SELECT id FROM tutors WHERE user_id = $1', [decoded.id]);
    const tutorId = tutorRes.rows[0]?.id;
    if (!tutorId) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    await query(
      'UPDATE enrollments SET status = \'inactive\' WHERE id = $1 AND tutor_id = $2',
      [id, tutorId]
    );

    return NextResponse.json({ message: 'Student unenrolled successfully' });
  } catch (error) {
    console.error('Error unenrolling student:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}