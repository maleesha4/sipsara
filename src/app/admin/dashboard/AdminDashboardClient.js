// ============================================
// FILE: src/app/admin/dashboard/AdminDashboardClient.js
// ============================================
'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar'; // Adjust path as needed
import Link from 'next/link';

export default function AdminDashboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTutors: 0,
    totalExams: 0,
    activeExams: 0,
    pendingRegistrations: 0
  });
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const successMessage = searchParams.get('success');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (successMessage) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user
      const userRes = await fetch('/api/auth/me');
      if (userRes.status === 401) {
        router.push('/login');
        return;
      }
      if (userRes.status !== 200) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await userRes.json();
      const fetchedUser = userData.user;
      if (!fetchedUser || fetchedUser.role !== 'admin') {
        router.push('/login');
        return;
      }
      setUser(fetchedUser);

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.status === 401) {
        router.push('/login');
        return;
      }
      if (statsRes.status !== 200) {
        throw new Error('Failed to fetch stats');
      }
      const statsData = await statsRes.json();
      console.log('Stats API:', statsData);
      setStats(statsData.stats || {});

      // Fetch recent exams
      const examsRes = await fetch('/api/admin/exams');
      if (examsRes.status === 401) {
        router.push('/login');
        return;
      }
      if (examsRes.status !== 200) {
        throw new Error('Failed to fetch exams');
      }
      const examsData = await examsRes.json();
      setRecentExams(examsData.exams?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError(error.message);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p>{error}</p>
          <button onClick={fetchData} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Retry
          </button>
          <Link href="/login" className="ml-2 bg-red-500 text-white px-4 py-2 rounded">
            Logout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      {/* Success Notification */}
      {showNotification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse z-50">
          ✓ {successMessage}
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            {stats.totalStudents ? (
              <div className="text-lg space-y-1">
                <p>Grade 6: {stats.totalStudents?.grade6 || 0}</p>
                <p>Grade 7: {stats.totalStudents?.grade7 || 0}</p>
                <p>Grade 8: {stats.totalStudents?.grade8 || 0}</p>
                <p>Grade 9: {stats.totalStudents?.grade9 || 0}</p>
                <p>Grade 10: {stats.totalStudents?.grade10 || 0}</p>
                <p>Grade 11: {stats.totalStudents?.grade11 || 0}</p>
              </div>
            ) : (
              <p className="text-4xl font-bold">0</p>
            )}
          </div>

          <div className="bg-purple-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Tutors</h3>
            <p className="text-4xl font-bold">{stats.totalTutors}</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Exams</h3>
            <p className="text-4xl font-bold">{stats.totalExams}</p>
          </div>
          <div className="bg-orange-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Exams</h3>
            <p className="text-4xl font-bold">{stats.activeExams}</p>
          </div>
          <div className="bg-red-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Pending Registrations</h3>
            <p className="text-4xl font-bold">{stats.pendingRegistrations}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/exams/create" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-blue-600 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg">Create Exam</h3>
            <p className="text-gray-600 text-sm">Set up a new exam</p>
          </Link>
          <Link href="/admin/students" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-green-600 text-4xl mb-2">👥</div>
            <h3 className="font-semibold text-lg">Manage Students</h3>
            <p className="text-gray-600 text-sm">View & edit students</p>
          </Link>
          <Link href="/admin/tutors" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-purple-600 text-4xl mb-2">👨‍🏫</div>
            <h3 className="font-semibold text-lg">Manage Tutors</h3>
            <p className="text-gray-600 text-sm">View & edit tutors</p>
          </Link>
          <Link href="/admin/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-orange-600 text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-lg">Reports</h3>
            <p className="text-gray-600 text-sm">Analytics & reports</p>
          </Link>
          <Link href="/admin/students/create" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-red-600 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg">Create Student</h3>
            <p className="text-gray-600 text-sm">Add a new student</p>
          </Link>
          <Link href="/admin/tutors/create" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-indigo-600 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg">Create Tutor</h3>
            <p className="text-gray-600 text-sm">Add a new tutor</p>
          </Link>
        </div>

        {/* Recent Exams */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Exams</h2>
            <Link href="/admin/exams" className="text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
          {recentExams.length === 0 ? (
            <p className="text-gray-500">No exams created yet</p>
          ) : (
            <div className="space-y-3">
              {recentExams.map(exam => (
                <div key={exam.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{exam.exam_name}</h3>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(exam.exam_date).toLocaleDateString()} | 
                        Status: {exam.status} | 
                        Registrations: {exam.registration_count}
                      </p>
                    </div>
                    <Link
                      href={`/admin/exams/${exam.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Manage →
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