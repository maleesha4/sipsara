import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function POST(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    const user = verifyToken(token);

    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark admission card as downloaded
    await query(
      `UPDATE exam_registrations 
       SET admission_card_downloaded = true
       WHERE id = $1 AND student_id IN (
         SELECT id FROM students WHERE user_id = $2
       )`,
      [params.registrationId, user.id]
    );

    return NextResponse.json({ message: 'Marked as downloaded' });

  } catch (error) {
    console.error('Error marking downloaded:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}