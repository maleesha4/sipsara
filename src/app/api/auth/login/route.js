// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { query } from '../../../../lib/database';  // Adjusted path
import { verifyPassword, generateToken } from '../../../../lib/auth';  // Adjusted

export async function POST(request) {
  try {
    const { fullName, password } = await request.json();

    if (!fullName || !password) {
      return NextResponse.json({ error: 'Full name and password are required' }, { status: 400 });
    }

    const userResult = await query(
      `SELECT id, email, password_hash, role, full_name, status
       FROM users
       WHERE full_name = $1`,
      [fullName.trim()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = generateToken(user);

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        role: user.role,
        full_name: user.full_name
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'  // Prevent caching
      }
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);  // Logs to Vercel
    return NextResponse.json({ error: 'Login failed: ' + error.message }, { status: 500 });
  }
}