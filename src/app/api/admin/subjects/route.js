// ============================================
// FILE: src/app/api/admin/subjects/route.js
// ============================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query('SELECT * FROM subjects ORDER BY subject_name');
    return NextResponse.json({ subjects: result.rows });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}