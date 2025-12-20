// ============================================
// FILE: src/app/admin/dashboard/AdminDashboardClient.js (DARK MODE SUPPORT)
// ============================================
'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar'; // Adjust path as needed
import Link from 'next/link';
import ChangePasswordModal from '../../../components/ChangePasswordModal';
import AdminChangePasswordModal from '../../../components/AdminChangePasswordModal';

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
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
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
      // Updated: Dark mode for loading screen
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      // Updated: Dark mode for error screen
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">Error Loading Dashboard</h1>
          <p className="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
          <button 
            onClick={fetchData} 
            className="mr-2 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Retry
          </button>
          <Link 
            href="/login" 
            className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </Link>
        </div>
      </div>
    );
  }

  return (
    // Updated: Page background for dark mode
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar user={user} />
      
      {/* Success Notification - Updated: Colors for dark mode */}
      {showNotification && (
        <div className="fixed top-20 right-4 bg-green-500 dark:bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          ✓ {successMessage}
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        {/* Updated: Header text for dark mode */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Admin Dashboard</h1>

        {/* Stats Cards - Updated: Colors and text for dark mode */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-500 dark:bg-blue-600 text-white p-6 rounded-lg shadow">
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

          <div className="bg-purple-500 dark:bg-purple-600 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Tutors</h3>
            <p className="text-4xl font-bold">{stats.totalTutors}</p>
          </div>
          <div className="bg-green-500 dark:bg-green-600 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Exams</h3>
            <p className="text-4xl font-bold">{stats.totalExams}</p>
          </div>
          <div className="bg-orange-500 dark:bg-orange-600 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Exams</h3>
            <p className="text-4xl font-bold">{stats.activeExams}</p>
          </div>
        </div>

        {/* Quick Actions - Updated: Card backgrounds and text for dark mode */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/exams/create" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
            <div className="text-blue-600 dark:text-blue-400 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Create Exam</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Set up a new exam</p>
          </Link>
          <Link href="/admin/students" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-green-500">
            <div className="text-green-600 dark:text-green-400 text-4xl mb-2">👥</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Manage Students</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View & edit students</p>
          </Link>
          <Link href="/admin/tutors" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-purple-500">
            <div className="text-purple-600 dark:text-purple-400 text-4xl mb-2">👨‍🏫</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Manage Tutors</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View & edit tutors</p>
          </Link>
          <Link href="/admin/results" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <div className="text-indigo-600 dark:text-indigo-400 text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Exam Results</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View all exam results</p>
          </Link>
          <Link href="/admin/reports" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-orange-500">
            <div className="text-orange-600 dark:text-orange-400 text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Reports</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Analytics & reports</p>
          </Link>
          <Link href="/admin/students/create" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-red-500">
            <div className="text-red-600 dark:text-red-400 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Create Student</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Add a new student</p>
          </Link>
          <Link href="/admin/tutors/create" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <div className="text-indigo-600 dark:text-indigo-400 text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Create Tutor</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Add a new tutor</p>
          </Link>
          <Link href="/admin/subjects/create" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-teal-500">
            <div className="text-teal-600 dark:text-teal-400 text-4xl mb-2">📚</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Create Subject</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Add a new subject</p>
          </Link>
        </div>

        {/* Recent Exams - Updated: Card and text for dark mode */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Exams</h2>
            <Link href="/admin/exams" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              View All →
            </Link>
          </div>
          {recentExams.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No exams created yet</p>
          ) : (
            <div className="space-y-3">
              {recentExams.map(exam => (
                <div key={exam.id} className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{exam.exam_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Date: {new Date(exam.exam_date).toLocaleDateString()} | 
                        Status: <span className="capitalize">{exam.status}</span> | 
                        Registrations: {exam.registration_count || 0}
                      </p>
                    </div>
                    <Link
                      href={`/admin/exams/${exam.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Change Password Buttons - Footer - Updated: Background and button colors for dark mode */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-4">
        <div className="container mx-auto flex justify-end gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Change My Password
          </button>
          <button
            onClick={() => setShowAdminPasswordModal(true)}
            className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
            </svg>
            Change User Password
          </button>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)}
        user={user}
      />
      <AdminChangePasswordModal 
        isOpen={showAdminPasswordModal} 
        onClose={() => setShowAdminPasswordModal(false)}
      />
    </div>
  );
}