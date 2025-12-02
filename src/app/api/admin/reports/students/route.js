// ============================================
// FILE: src/app/api/admin/reports/students/route.js
// ============================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT s.id, s.index_number, u.full_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.index_number`
    );

    return NextResponse.json({ students: result.rows });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
