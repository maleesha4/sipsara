// src/app/api/student/assignments/[id]/submit/route.js

import pool from '../../../../../../lib/database';
import { verifyToken } from '../../../../../../lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/assignments');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xlsx', 'xls', 'txt', 'jpg', 'jpeg', 'png', 'gif'];

// Simple UUID v4 generator without external dependency
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function POST(request, { params: paramsPromise }) {
  try {
    const params = await paramsPromise;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'student') {
      return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
    }

    const assignmentId = params.id;
    const formData = await request.formData();
    const files = formData.getAll('files');
    const groupMembersJson = formData.get('groupMembers');
    const groupMembers = groupMembersJson ? JSON.parse(groupMembersJson) : [];

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ message: 'No files provided' }), { status: 400 });
    }

    let client;
    try {
      client = await pool.connect();
    } catch (error) {
      console.error('Database connection timeout:', error);
      return new Response(JSON.stringify({ message: 'Database connection timeout. Please try again.' }), { status: 503 });
    }

    try {
      const studentRes = await client.query(
        'SELECT id FROM students WHERE user_id = $1',
        [decoded.id]
      );

      if (studentRes.rows.length === 0) {
        return new Response(JSON.stringify({ message: 'Student not found' }), { status: 404 });
      }

      const studentId = studentRes.rows[0].id;

      const assignmentRes = await client.query(
        'SELECT id, due_date, closing_time, is_group FROM assignments WHERE id = $1',
        [assignmentId]
      );

      if (assignmentRes.rows.length === 0) {
        return new Response(JSON.stringify({ message: 'Assignment not found' }), { status: 404 });
      }

      const assignment = assignmentRes.rows[0];
      
      // Get server time from database to ensure consistent timezone handling
      const timeRes = await client.query(`SELECT NOW() as server_time`);
      const serverNow = new Date(timeRes.rows[0].server_time);
      
      // Check if this is a group assignment but no group members selected
      if (assignment.is_group && (!groupMembers || groupMembers.length === 0)) {
        return new Response(JSON.stringify({ 
          message: 'This is a group assignment. Please select at least one group member to submit with.' 
        }), { status: 400 });
      }
      
      // Parse due_date (YYYY-MM-DD) and closing_time (HH:MM:SS) as local time (not UTC)
      // This matches what the tutor entered and what students see
      // Handle both string and Date object formats from database
      let dateStr = assignment.due_date;
      if (dateStr instanceof Date) {
        // If it's a Date object, convert to YYYY-MM-DD string
        const year = dateStr.getFullYear();
        const month = String(dateStr.getMonth() + 1).padStart(2, '0');
        const day = String(dateStr.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
      
      const timeStr = assignment.closing_time; // e.g., "18:00:00"
      
      // Create deadline in local timezone (same as what user selected in form)
      const [year, month, day] = dateStr.split('-');
      const [hours, minutes, seconds] = timeStr.split(':');
      const dueDateTime = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds || 0));
      
      // Calculate grace period deadline (24 hours after due date)
      const gracePeriodDeadline = new Date(dueDateTime.getTime() + 24 * 60 * 60 * 1000);
      
      // Determine if submission is late (submitted after due date but within grace period)
      const isLate = serverNow > dueDateTime;
      
      // Check if submission is allowed (must be before grace period deadline)
      if (serverNow > gracePeriodDeadline) {
        return new Response(JSON.stringify({ 
          message: 'Assignment submission period has ended. No more submissions accepted.' 
        }), { status: 403 });
      }

      const submissionRes = await client.query(
        `SELECT id FROM assignment_submissions
        WHERE assignment_id = $1 AND student_id = $2`,
        [assignmentId, studentId]
      );

      let submissionId;
      if (submissionRes.rows.length > 0) {
        submissionId = submissionRes.rows[0].id;
        await client.query(
          'DELETE FROM assignment_submission_files WHERE submission_id = $1',
          [submissionId]
        );
      } else {
        const newSubmissionRes = await client.query(
          `INSERT INTO assignment_submissions (assignment_id, student_id, status, is_late)
          VALUES ($1, $2, 'submitted', $3)
          RETURNING id`,
          [assignmentId, studentId, isLate]
        );
        submissionId = newSubmissionRes.rows[0].id;
      }

      await client.query(
        `UPDATE assignment_submissions 
        SET status = 'submitted', submission_date = NOW() AT TIME ZONE 'UTC', is_late = $1
        WHERE id = $2`,
        [isLate, submissionId]
      );

      // If this is a group assignment, add group members
      if (assignment.is_group && groupMembers.length > 0) {
        for (const memberId of groupMembers) {
          // For group assignments, create/update submission records for all group members with the same status
          const memberSubmissionRes = await client.query(
            `INSERT INTO assignment_submissions (assignment_id, student_id, status, is_late)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (assignment_id, student_id) 
            DO UPDATE SET status = $3, is_late = $4, submission_date = NOW() AT TIME ZONE 'UTC'
            RETURNING id`,
            [assignmentId, memberId, 'submitted', isLate]
          );
          
          const memberSubmissionId = memberSubmissionRes.rows[0].id;
          
          // Link group member to the main submission
          await client.query(
            `INSERT INTO assignment_group_members (submission_id, student_id)
            VALUES ($1, $2)
            ON CONFLICT (submission_id, student_id) DO NOTHING`,
            [submissionId, memberId]
          );
        }
      }

      await mkdir(UPLOAD_DIR, { recursive: true });

      const uploadedFiles = [];
      for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();

        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return new Response(JSON.stringify({ 
            message: `File type .${ext} not allowed` 
          }), { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        if (buffer.byteLength > MAX_FILE_SIZE) {
          return new Response(JSON.stringify({ 
            message: `File "${file.name}" is too large` 
          }), { status: 400 });
        }

        const filename = `${generateUUID()}.${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        await writeFile(filepath, Buffer.from(buffer));

        const fileRes = await client.query(
          `INSERT INTO assignment_submission_files (submission_id, file_name, file_url, uploaded_at)
          VALUES ($1, $2, $3, NOW())
          RETURNING file_name, file_url`,
          [submissionId, file.name, `/uploads/assignments/${filename}`]
        );

        uploadedFiles.push(fileRes.rows[0]);
      }

      return new Response(JSON.stringify({
        message: 'Assignment submitted successfully',
        submission: { id: submissionId, status: 'submitted', is_late: isLate, files: uploadedFiles }
      }), { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in submit route:', error);
    
    // Handle timeout errors specifically
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return new Response(JSON.stringify({ message: 'Request timeout. Please try again.' }), { status: 504 });
    }
    
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}