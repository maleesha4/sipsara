// ============================================
// FILE: app/api/admin/exams/[id]/publish/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { query } from '../../../../../lib/database';
import { cookies } from 'next/headers';

export async function POST(request, { params }) {
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

    const paramsObj = await params;
    const id = paramsObj?.id;

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await query(
      'UPDATE admin_exams SET status = $1, published_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['published', id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}