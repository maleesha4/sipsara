// ============================================
// FILE: src/app/api/admin/reports/financial/route.js
// ============================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    const user = verifyToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Overall financial summary
    const summaryResult = await query(
      `SELECT 
         COUNT(er.id) as total_registrations,
         SUM(e.exam_fee) as total_revenue,
         SUM(CASE WHEN er.payment_status = 'paid' THEN e.exam_fee ELSE 0 END) as collected,
         SUM(CASE WHEN er.payment_status = 'pending' THEN e.exam_fee ELSE 0 END) as pending,
         SUM(CASE WHEN er.payment_status = 'refunded' THEN e.exam_fee ELSE 0 END) as refunded_amount,
         COUNT(CASE WHEN er.payment_status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN er.payment_status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN er.payment_status = 'refunded' THEN 1 END) as refunded_count,
         AVG(e.exam_fee) as avg_fee
       FROM exam_registrations er
       JOIN exams e ON er.exam_id = e.id`
    );

    const summary = summaryResult.rows[0];
    const collectionRate = summary.total_revenue > 0 
      ? ((summary.collected / summary.total_revenue) * 100).toFixed(2)
      : 0;

    // Exam-wise breakdown
    const examBreakdownResult = await query(
      `SELECT 
         e.exam_name,
         e.exam_date,
         e.exam_fee,
         COUNT(er.id) as total_registrations,
         COUNT(CASE WHEN er.payment_status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN er.payment_status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN er.payment_status = 'refunded' THEN 1 END) as refunded_count,
         (COUNT(er.id) * e.exam_fee) as potential_revenue,
         (COUNT(CASE WHEN er.payment_status = 'paid' THEN 1 END) * e.exam_fee) as collected_revenue
       FROM exams e
       LEFT JOIN exam_registrations er ON e.id = er.exam_id
       GROUP BY e.id, e.exam_name, e.exam_date, e.exam_fee
       ORDER BY e.exam_date DESC`
    );

    return NextResponse.json({
      summary: {
        ...summary,
        collection_rate: collectionRate
      },
      examBreakdown: examBreakdownResult.rows
    });

  } catch (error) {
    console.error('Error fetching financial report:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
