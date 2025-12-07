// ============================================
// FILE: src/app/admin/dashboard/AdminDashboardClient.js
// ============================================
'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar'; // Adjust path as needed
import Link from 'next/link';
import ChangePasswordModal from '../../../components/ChangePasswordModal';

export default function AdminDashboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: { grade6: 0, grade7: 0, grade8: 0, grade9: 0, grade10: 0, grade11: 0 },
    totalTutors: 0,
    totalExams: 0,
    activeExams: 0,
    pendingRegistrations: 0
  });
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const successMessage = searchParams.get('success');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

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
      const userRes = await fetch('/api/auth/me', { 
        headers: getAuthHeaders(),
        credentials: 'same-origin'
      });
      if (userRes.status === 401) {
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }
      if (userRes.status !== 200) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await userRes.json();
      const fetchedUser = userData.user;
      if (!fetchedUser || fetchedUser.role !== 'admin') {
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }
      setUser(fetchedUser);

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', { 
        headers: getAuthHeaders(),
        credentials: 'same-origin'
      });
      if (statsRes.status === 401) {
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }
      if (statsRes.status !== 200) {
        throw new Error('Failed to fetch stats');
      }
      const statsData = await statsRes.json();
      console.log('Stats API:', statsData);
      setStats(statsData.stats || {
        totalStudents: { grade6: 0, grade7: 0, grade8: 0, grade9: 0, grade10: 0, grade11: 0 },
        totalTutors: 0,
        totalExams: 0,
        activeExams: 0,
        pendingRegistrations: 0
      });

      // Fetch recent exams
      const examsRes = await fetch('/api/admin/exams', { 
        headers: getAuthHeaders(),
        credentials: 'same-origin'
      });
      if (examsRes.status === 401) {
        localStorage.removeItem('auth_token');
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
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Dashboard</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <button 
            onClick={fetchData} 
            className="mr-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
          <Link 
            href="/login" 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Logout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar user={user} />
      
      {/* Success Notification */}
      {showNotification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          ✓ {successMessage}
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            <div className="text-lg space-y-1">
              <p>Grade 6: {stats.totalStudents.grade6 || 0}</p>
              <p>Grade 7: {stats.totalStudents.grade7 || 0}</p>
              <p>Grade 8: {stats.totalStudents.grade8 || 0}</p>
              <p>Grade 9: {stats.totalStudents.grade9 || 0}</p>
              <p>Grade 10: {stats.totalStudents.grade10 || 0}</p>
              <p>Grade 11: {stats.totalStudents.grade11 || 0}</p>
            </div>
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
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/exams/create" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-blue-600 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg">Create Exam</h3>
            <p className="text-gray-600 text-sm">Set up a new exam</p>
          </Link>
          <Link href="/admin/students" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-green-600 text-4xl mb-2">👥</div>
            <h3 className="font-semibold text-lg">Manage Students</h3>
            <p className="text-gray-600 text-sm">View & edit students</p>
          </Link>
          <Link href="/admin/tutors" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-purple-600 text-4xl mb-2">👨‍🏫</div>
            <h3 className="font-semibold text-lg">Manage Tutors</h3>
            <p className="text-gray-600 text-sm">View & edit tutors</p>
          </Link>
          <Link href="/admin/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-orange-600 text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-lg">Reports</h3>
            <p className="text-gray-600 text-sm">Analytics & reports</p>
          </Link>
          <Link href="/admin/students/create" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-red-600 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg">Create Student</h3>
            <p className="text-gray-600 text-sm">Add a new student</p>
          </Link>
          <Link href="/admin/tutors/create" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-indigo-600 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg">Create Tutor</h3>
            <p className="text-gray-600 text-sm">Add a new tutor</p>
          </Link>
          <Link href="/admin/subjects/create" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-teal-600 text-4xl mb-2">📚</div>
            <h3 className="font-semibold text-lg">Create Subject</h3>
            <p className="text-gray-600 text-sm">Add a new subject</p>
          </Link>
        </div>

        {/* Recent Exams */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Exams</h2>
            <Link href="/admin/exams" className="text-blue-600 hover:underline text-sm">
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
                      <h3 className="font-semibold text-gray-800">{exam.exam_name}</h3>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(exam.exam_date).toLocaleDateString()} | 
                        Status: <span className="capitalize">{exam.status}</span> | 
                        Registrations: {exam.registration_count || 0}
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

      {/* Change Password Button - Footer */}
      <div className="bg-white border-t border-gray-300 p-4">
        <div className="container mx-auto flex justify-end">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Change Password
          </button>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)}
        user={user}
      />
    </div>
  );
}