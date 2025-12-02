// ============================================
// FILE: src/app/api/auth/me/route.js
// ============================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Single query - only fetch columns that exist
    const result = await query(`
      SELECT 
        u.id, 
        u.email, 
        u.role, 
        u.full_name, 
        u.phone,
        u.profile_photo
      FROM users u
      WHERE u.id = $1
      LIMIT 1
    `, [decoded.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}