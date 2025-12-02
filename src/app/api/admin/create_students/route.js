// app/api/admin/create_students/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';
import { hashPassword } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decodedUser = verifyToken(token);  // Renamed to avoid redeclaration

    if (!decodedUser || decodedUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, email, phone, password, indexNumber, dateOfBirth, address, parentName, gender, grade } = body;

    // Basic validation
    const requiredFields = [fullName, email, password, indexNumber, dateOfBirth, address, parentName, gender, grade];
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

    // Index number validation (e.g., 12 digits, optional birth year check)
    const idRegex = /^\d{12}$/;
    if (!idRegex.test(indexNumber)) {
      return NextResponse.json({ error: 'Index number must be exactly 12 digits' }, { status: 400 });
    }

    // Check if full_name already exists
    const existingUser = await query('SELECT id FROM users WHERE full_name = $1', [fullName]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Full name already registered' }, { status: 400 });
    }

    // Check if index_number already exists
    const existingIndex = await query('SELECT id FROM students WHERE index_number = $1', [indexNumber]);
    if (existingIndex.rows.length > 0) {
      return NextResponse.json({ error: 'Index number already exists' }, { status: 400 });
    }

    // Get grade_id for the selected grade
    const gradeResult = await query('SELECT id FROM grades WHERE year = $1 AND status = $2', [parseInt(grade), 'active']);
    if (gradeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid grade selected' }, { status: 400 });
    }
    const gradeId = gradeResult.rows[0].id;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert into users table
    const userResult = await query(
      `INSERT INTO users
        (email, password_hash, role, full_name, phone, status)
       VALUES ($1, $2, 'student', $3, $4, 'active')
       RETURNING id, full_name, role`,
      [email, passwordHash, fullName, phone]
    );
    const createdUser = userResult.rows[0];

    // Insert into students table
    await query(
      `INSERT INTO students (user_id, index_number, current_grade_id, date_of_birth, address, parent_name, gender, enrollment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)`,
      [createdUser.id, indexNumber, gradeId, dateOfBirth, address, parentName, gender]
    );

    return NextResponse.json({
      message: 'Student created successfully',
      student: {
        id: createdUser.id,
        fullName: createdUser.full_name,
        role: createdUser.role
      }
    });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}