// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { query } from '../../../../lib/database';
import { verifyPassword, generateToken } from '../../../../lib/auth';
export async function POST(request) {
console.log('[LOGIN API] Request received');
try {
const { fullName, password } = await request.json();
console.log('[LOGIN API] Login attempt for:', fullName);
if (!fullName || !password) {
  console.log('[LOGIN API] Missing credentials');
  return NextResponse.json({ error: 'Full name and password are required' }, { status: 400 });
}

const userResult = await query(
  `SELECT id, email, password_hash, role, full_name, status
   FROM users
   WHERE full_name = $1`,
  [fullName.trim()]
);

if (userResult.rows.length === 0) {
  console.log('[LOGIN API] User not found:', fullName);
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}

const user = userResult.rows[0];
console.log('[LOGIN API] User found:', { id: user.id, role: user.role, status: user.status });

if (user.status !== 'active') {
  console.log('[LOGIN API] Account not active');
  return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
}

const isValid = await verifyPassword(password, user.password_hash);
if (!isValid) {
  console.log('[LOGIN API] Invalid password');
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}

// Update last login
await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

const token = generateToken(user);
console.log('[LOGIN API] Token generated for user:', user.id);

const response = NextResponse.json({
  message: 'Login successful',
  user: {
    id: user.id,
    role: user.role,
    full_name: user.full_name
  }
});

// FIXED: Better cookie configuration for Vercel
response.cookies.set('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  domain: undefined // Let Vercel handle this
});

console.log('[LOGIN API] Cookie set, returning response');
return response;
} catch (error) {
console.error('[LOGIN API] Error:', error);
return NextResponse.json({
error: 'Login failed: ' + error.message
}, { status: 500 });
}
}