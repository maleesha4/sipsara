'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default function StudentRegistrations() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      const regsRes = await fetch('/api/student/registrations');
      if (regsRes.ok) {
        const regsData = await regsRes.json();
        setRegistrations(regsData.registrations || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'registered': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Exam Registrations</h1>
          <Link 
            href="/student/dashboard"
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-lg">Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">You haven't registered for any exams yet</p>
            <Link 
              href="/student/exams"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Browse Available Exams
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map(reg => (
              <div key={reg.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{reg.exam_name}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Exam Date:</span> {formatDate(reg.exam_date)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Registered Date:</span> {formatDate(reg.registration_date)}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded text-sm font-semibold ${getStatusColor(reg.status)}`}>
                    {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    <span className="font-semibold">Admission Number:</span> 
                    <span className="font-mono ml-2">{reg.admission_number}</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Selected Subjects:</span>
                  </p>
                  {reg.chosen_subjects ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {reg.chosen_subjects.split(', ').map((subject, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                          {subject}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mt-2">No subjects selected</p>
                  )}
                </div>

                <div className="flex gap-2">
                  {reg.published_at && (
                    <Link
                      href={`/student/results/${reg.admin_exam_id}`}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition text-sm font-semibold"
                    >
                      View Results
                    </Link>
                  )}
                  {!reg.published_at && (
                    <div className="text-sm text-gray-500">
                      Results will be available after exam completion and publication
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}