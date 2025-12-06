// ============================================
// FILE: src/app/api/admin/subjects/route.js (SIMPLIFIED - No usage check)
// ============================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/database';

export async function GET(req) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND name ILIKE $1';
      params.push(`%${search}%`);
    }

    const result = await query(
      `SELECT id, name FROM subjects ${whereClause} ORDER BY name`,
      params
    );

    return NextResponse.json({ subjects: result.rows });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM subjects WHERE name = $1', [name.trim()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Subject already exists' }, { status: 400 });
    }

    await query(`SELECT setval('subjects_id_seq', (SELECT COALESCE(MAX(id), 0) FROM subjects), true)`);
    
    const result = await query(
      'INSERT INTO subjects (name) VALUES ($1) RETURNING id, name',
      [name.trim()]
    );

    return NextResponse.json({
      message: 'Subject created successfully',
      subject: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subject ID required' }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM subjects WHERE name = $1 AND id != $2', [name.trim(), id]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Subject name already exists' }, { status: 400 });
    }

    await query(
      'UPDATE subjects SET name = $1 WHERE id = $2',
      [name.trim(), id]
    );

    return NextResponse.json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Subject ID required' }, { status: 400 });
    }

    // SIMPLIFIED: Let PostgreSQL foreign key constraints handle the check
    // If subject is in use, the database will throw an error
    try {
      const result = await query('DELETE FROM subjects WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Subject deleted successfully' });
    } catch (dbError) {
      console.error('Database error during deletion:', dbError);
      
      // Check if it's a foreign key constraint error
      if (dbError.code === '23503') {
        return NextResponse.json({ 
          error: 'Cannot delete subject: It is being used by other records' 
        }, { status: 400 });
      }
      
      throw dbError;
    }

  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}