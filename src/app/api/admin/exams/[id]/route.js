// ============================================
// FILE: app/api/admin/exams/[id]/route.js
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { query } from '../../../../../lib/database';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
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
    console.log('Full params object:', paramsObj); // Debug: log full params
    const id = paramsObj?.id;
    console.log('Extracted ID:', id); // Log the ID being fetched

    if (!id) {
      console.log('Invalid or missing ID param');
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const result = await query(`
      SELECT 
        ae.*,
        g.grade_name
      FROM admin_exams ae
      LEFT JOIN grades g ON ae.grade_id = g.id
      WHERE ae.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      console.log('Exam not found for ID:', id);
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const exam = result.rows[0];
    console.log('Exam data:', exam); // Log the fetched exam data
    return NextResponse.json({ exam });
  } catch (error) {
    console.error('Error fetching exam data:', error);
    return NextResponse.json({ error: 'Failed to fetch exam data' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
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

    const body = await request.json();
    const updates = [];
    const values = [];
    let idx = 1;

    if (body.exam_name) {
      updates.push(`exam_name = $${idx}`);
      values.push(body.exam_name);
      idx++;
    }
    if (body.grade_id) {
      updates.push(`grade_id = $${idx}`);
      values.push(body.grade_id);
      idx++;
    }
    if (body.exam_date) {
      updates.push(`exam_date = $${idx}`);
      values.push(body.exam_date);
      idx++;
    }
    if (body.registration_start_date) {
      updates.push(`registration_start_date = $${idx}`);
      values.push(body.registration_start_date);
      idx++;
    }
    if (body.registration_end_date) {
      updates.push(`registration_end_date = $${idx}`);
      values.push(body.registration_end_date);
      idx++;
    }
    if (body.description !== undefined) {
      updates.push(`description = $${idx}`);
      values.push(body.description);
      idx++;
    }
    if (body.status) {
      updates.push(`status = $${idx}`);
      values.push(body.status);
      idx++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE admin_exams SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Update subjects junctions if subject_ids provided
    if (body.subject_ids && Array.isArray(body.subject_ids) && body.subject_ids.length > 0) {
      // Delete old
      await query('DELETE FROM admin_exam_subjects WHERE admin_exam_id = $1', [id]);
      // Insert new
      for (const subjectId of body.subject_ids) {
        await query('INSERT INTO admin_exam_subjects (admin_exam_id, subject_id) VALUES ($1, $2)', [id, subjectId]);
      }
    }

    return NextResponse.json({ success: true, exam: result.rows[0] });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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

    // Delete junctions first
    await query('DELETE FROM admin_exam_subjects WHERE admin_exam_id = $1', [id]);

    // Delete exam
    await query('DELETE FROM admin_exams WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}