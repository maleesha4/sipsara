// ============================================
// FILE: src/app/admin/reports/page.js
// ============================================
'use client';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default function AdminReports() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Performance Report */}
          <Link
            href="/admin/reports/student-performance"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition p-6"
          >
            <div className="text-blue-600 text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Student Performance</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive analysis of individual student performance across all exams
            </p>
            <span className="text-blue-600 font-semibold">View Report →</span>
          </Link>

          {/* Exam Comparison Report */}
          <Link
            href="/admin/reports/exam-comparison"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition p-6"
          >
            <div className="text-green-600 text-5xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-2">Exam Comparison</h3>
            <p className="text-gray-600 mb-4">
              Compare performance across different exams and identify trends
            </p>
            <span className="text-green-600 font-semibold">View Report →</span>
          </Link>

          {/* Subject Analysis Report */}
          <Link
            href="/admin/reports/subject-analysis"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition p-6"
          >
            <div className="text-purple-600 text-5xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">Subject Analysis</h3>
            <p className="text-gray-600 mb-4">
              Subject-wise performance trends and difficulty analysis
            </p>
            <span className="text-purple-600 font-semibold">View Report →</span>
          </Link>

          {/* Tutor Performance Report */}
          <Link
            href="/admin/reports/tutor-performance"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition p-6"
          >
            <div className="text-orange-600 text-5xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-bold mb-2">Tutor Performance</h3>
            <p className="text-gray-600 mb-4">
              Track tutor workload, marks entry speed, and student outcomes
            </p>
            <span className="text-orange-600 font-semibold">View Report →</span>
          </Link>

          {/* Attendance Report */}
          <Link
            href="/admin/reports/attendance"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition p-6"
          >
            <div className="text-red-600 text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-2">Attendance Report</h3>
            <p className="text-gray-600 mb-4">
              Exam attendance rates and student participation trends
            </p>
            <span className="text-red-600 font-semibold">View Report →</span>
          </Link>

          {/* Financial Report */}
          <Link
            href="/admin/reports/financial"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition p-6"
          >
            <div className="text-teal-600 text-5xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Financial Report</h3>
            <p className="text-gray-600 mb-4">
              Revenue tracking, payment status, and financial summaries
            </p>
            <span className="text-teal-600 font-semibold">View Report →</span>
          </Link>

          {/* Top Performers Report */}
          <Link
            href="/admin/reports/top-performers"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition p-6"
          >
            <div className="text-yellow-600 text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Top Performers</h3>
            <p className="text-gray-600 mb-4">
              Leaderboard and recognition for outstanding students
            </p>
            <span className="text-yellow-600 font-semibold">View Report →</span>
          </Link>

          {/* Grade Distribution Report */}
          <Link
            href="/admin/reports/grade-distribution"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition p-6"
          >
            <div className="text-indigo-600 text-5xl mb-4">📉</div>
            <h3 className="text-xl font-bold mb-2">Grade Distribution</h3>
            <p className="text-gray-600 mb-4">
              Visual analysis of grade distributions across exams
            </p>
            <span className="text-indigo-600 font-semibold">View Report →</span>
          </Link>

          {/* Custom Report Builder */}
          <Link
            href="/admin/reports/custom"
            className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition p-6"
          >
            <div className="text-white text-5xl mb-4">🔧</div>
            <h3 className="text-xl font-bold mb-2">Custom Report</h3>
            <p className="mb-4">
              Build your own custom reports with flexible filters
            </p>
            <span className="font-semibold">Create Report →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

