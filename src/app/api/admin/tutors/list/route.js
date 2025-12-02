// ============================================
// FILE: app/api/admin/tutors/list/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { query } from '../../../../../lib/database';
import { cookies } from 'next/headers';

export async function GET(request) {
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

    const result = await query(`
      SELECT 
        t.id,
        u.full_name,
        u.email,
        s.name as subject_name,
        s.id as subject_id
      FROM tutors t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE u.role = 'tutor' AND u.status = 'active'
      ORDER BY u.full_name
    `);
    return NextResponse.json({ tutors: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}