// ============================================
// FILE: src/app/tutor/dashboard/page.js
// ============================================
'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default function TutorDashboardClient() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    mySubjects: [],        // array of {id, name}
    activeExams: 0,
    totalPapers: 0,
    studentCounts: {}      // e.g., {6: count, 7: count, ...}
  });
  const [recentExams, setRecentExams] = useState([]);  // array of {id, exam_name, date, student_count_per_subject}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch logged-in user
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);

      // Fetch stats (subjects, active exams count, etc.)
      const statsRes = await fetch('/api/tutor/stats');
      const statsData = await statsRes.json();
      setStats(statsData.stats || {});

      // Fetch recent exams (assigned admin_exams with student counts per subject)
      const examsRes = await fetch('/api/tutor/exams');
      const examsData = await examsRes.json();
      setRecentExams(examsData.exams || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tutor Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* My Subjects */}
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">My Subjects</h3>
            <br />
            <div className="text-lg mt-2 space-y-1">
              {(stats.mySubjects || []).map(sub => (
                <p key={sub.id}>{sub.name}</p>
              ))}
            </div>
          </div>

          {/* Active Exams */}
          <div className="bg-green-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Exams</h3>
            <p className="text-4xl font-bold">{stats.activeExams}</p>
          </div>

          {/* Papers Uploaded */}
          <div className="bg-orange-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Papers Uploaded</h3>
            <p className="text-4xl font-bold">{stats.totalPapers}</p>
          </div>

          {/* Total Students */}
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            {Object.keys(stats.studentCounts || {}).length > 0 ? (
              <div className="text-lg space-y-1">
                <p>Grade 6: {stats.studentCounts[6] || 0}</p>
                <p>Grade 7: {stats.studentCounts[7] || 0}</p>
                <p>Grade 8: {stats.studentCounts[8] || 0}</p>
                <p>Grade 9: {stats.studentCounts[9] || 0}</p>
                <p>Grade 10: {stats.studentCounts[10] || 0}</p>
                <p>Grade 11: {stats.studentCounts[11] || 0}</p>
              </div>
            ) : (
              <p className="text-4xl font-bold">0</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Link href="/tutor/marks" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-blue-600 text-4xl mb-2">📝</div>
            <h3 className="font-semibold text-lg">Enter Marks</h3>
            <p className="text-gray-600 text-sm">Input student marks</p>
          </Link>
          <Link href="/tutor/papers" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-green-600 text-4xl mb-2">📄</div>
            <h3 className="font-semibold text-lg">Upload Papers</h3>
            <p className="text-gray-600 text-sm">Upload question papers</p>
          </Link>
          <Link href="/tutor/analytics" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-purple-600 text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-lg">View Analytics</h3>
            <p className="text-gray-600 text-sm">Student performance</p>
          </Link>
          <Link href="/tutor/add-students" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-orange-600 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg">Add Students</h3>
            <p className="text-gray-600 text-sm">Enroll new students</p>
          </Link>
          <Link href="/tutor/remove-students" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-red-600 text-4xl mb-2">➖</div>
            <h3 className="font-semibold text-lg">Remove Students</h3>
            <p className="text-gray-600 text-sm">Unenroll students</p>
          </Link>
        </div>

        {/* Recent Active Admin Exams (Assigned to Tutor) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Active Exams</h2>
          {recentExams.length === 0 ? (
            <p className="text-gray-500">No active exams assigned</p>
          ) : (
            <div className="space-y-3">
              {recentExams.map(exam => (
                <div key={exam.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-semibold">{exam.exam_name}</h3>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(exam.exam_date).toLocaleDateString()} | 
                    Grade: {exam.grade_name}
                  </p>
                  <div className="text-sm mt-2 space-y-1">
                    {exam.student_count_per_subject && Object.entries(exam.student_count_per_subject).map(([subjectName, count]) => (
                      <p key={subjectName}>• {subjectName}: {count} students</p>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Link
                      href={`/tutor/marks?examId=${exam.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Enter Marks →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}