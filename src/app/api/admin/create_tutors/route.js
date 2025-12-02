// app/api/admin/create_tutors/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword } from '../../../../lib/auth';
import { query } from '../../../../lib/database';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decodedUser = verifyToken(token);  // Renamed to avoid redeclaration

    if (!decodedUser || decodedUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, email, phone, password, subjectId } = body;

    // Basic validation
    const requiredFields = [fullName, email, password, subjectId];
    if (requiredFields.some(f => !f || f.toString().trim() === '')) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Email validation (Gmail only, as per registration)
    if (!email.endsWith('@gmail.com')) {
      return NextResponse.json({ error: 'Email must be a Gmail address' }, { status: 400 });
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 });
    }

    // Check if full_name already exists
    const existingUser = await query('SELECT id FROM users WHERE full_name = $1', [fullName]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Full name already registered' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert into users table
    const userResult = await query(
      `INSERT INTO users
        (email, password_hash, role, full_name, phone, status)
       VALUES ($1, $2, 'tutor', $3, $4, 'active')
       RETURNING id, full_name, role`,
      [email, passwordHash, fullName, phone]
    );
    const createdUser = userResult.rows[0];  // Renamed for clarity

    // Insert into tutors table
    await query(
      `INSERT INTO tutors (user_id, subject_id)
       VALUES ($1, $2)`,
      [createdUser.id, subjectId]
    );

    return NextResponse.json({
      message: 'Tutor created successfully',
      tutor: {
        id: createdUser.id,
        fullName: createdUser.full_name,
        role: createdUser.role
      }
    });

  } catch (error) {
    console.error('Error creating tutor:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}