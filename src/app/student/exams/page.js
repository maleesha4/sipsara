// ============================================
// FILE: src/app/student/exams/page.js
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';
import Image from 'next/image';

export default function StudentExams() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get user info
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      // Get available exams
      const examsRes = await fetch('/api/student/exams/available');
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData.exams || []);
      } else if (examsRes.status === 401) {
        router.push('/login');
        return;
      }

      // Get registrations
      const regsRes = await fetch('/api/student/registrations');
      if (regsRes.ok) {
        const regsData = await regsRes.json();
        setRegistrations(regsData.registrations || []);
      }
    } catch (err) {
      setError('Failed to load exams');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter out already registered exams from available list
  const availableExams = exams.filter(exam => 
    !registrations.some(reg => reg.admin_exam_id === exam.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg">Loading exams...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to view exams</p>
          <Link href="/login" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      <Navbar user={user} />

      {/* Back Button */}
      <div className="container mx-auto px-4 mt-4">
        <Link
          href="/student/dashboard"
          className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Available Exams</h1>
          <p className="text-gray-600">Register for exams available for your grade</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {availableExams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No exams available for registration</p>
            {registrations.length > 0 && (
              <p className="text-gray-500 text-sm mt-2">You have {registrations.length} registered exam(s). Check "My Registrations" on the dashboard.</p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableExams.map(exam => {
              const now = new Date();
              const regStart = new Date(exam.registration_start_date);
              const regEnd = new Date(exam.registration_end_date);
              const isRegOpen = now >= regStart && now <= regEnd && exam.status === 'registration_open';

              return (
                <div 
                  key={exam.id} 
                  className="bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{exam.exam_name}</h3>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <p>
                        <span className="font-semibold">Grade:</span> {exam.grade_name}
                      </p>
                      <p>
                        <span className="font-semibold">Exam Date:</span> {new Date(exam.exam_date).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-semibold">Subjects:</span> {exam.subject_count}
                      </p>
                      <p>
                        <span className="font-semibold">Registration:</span> {new Date(exam.registration_start_date).toLocaleDateString()} to {new Date(exam.registration_end_date).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-semibold">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                          exam.status === 'registration_open' ? 'bg-blue-100 text-blue-800' :
                          exam.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          exam.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                          exam.status === 'published' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.status}
                        </span>
                      </p>
                    </div>

                    {exam.description && (
                      <p className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded">
                        {exam.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      {isRegOpen ? (
                        <Link 
                          href={`/student/exams/register/${exam.id}`} 
                          className="block bg-blue-500 text-white text-center px-4 py-2 rounded font-semibold hover:bg-blue-600 transition"
                        >
                          Register Now
                        </Link>
                      ) : (
                        <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded text-center font-semibold">
                          Registration Closed
                        </div>
                      )}

                      {exam.published_at && (
                        <Link 
                          href={`/student/results/${exam.id}`} 
                          className="block bg-green-500 text-white text-center px-4 py-2 rounded font-semibold hover:bg-green-600 transition"
                        >
                          View Results
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}