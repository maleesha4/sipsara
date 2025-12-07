// ============================================
// FILE: src/app/student/dashboard/DashboardClient.js (UPDATED WITH BUTTON STATE CHANGE)
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import ChangePasswordModal from '../../../components/ChangePasswordModal';
import AdmissionCardGenerator from '../../../components/AdmissionCardGenerator';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`
});

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [exams, setExams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [downloadedIds, setDownloadedIds] = useState(new Set()); // Track downloaded registrations
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Check for success message from query params
    const success = searchParams.get('success');
    const admission = searchParams.get('admission');
    
    if (success === 'registered') {
      setSuccessMessage('Registration successful!');
      if (admission) {
        setAdmissionNumber(admission);
      }
      router.replace('/student/dashboard');
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get user info
      const userRes = await fetch('/api/auth/me', { headers: getAuthHeaders() });
      if (!userRes.ok) {
        localStorage.removeItem('auth_token');
        console.error('Unauthorized access');
        router.push('/login?error=unauthorized');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      // Get available exams
      const examsRes = await fetch('/api/student/exams/available', { headers: getAuthHeaders() });
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData.exams || []);
      }

      // Get my registrations
      const regsRes = await fetch('/api/student/registrations', { headers: getAuthHeaders() });
      if (regsRes.ok) {
        const regsData = await regsRes.json();
        setRegistrations(regsData.registrations || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      localStorage.removeItem('auth_token');
      router.push('/login?error=fetch_failed');
    } finally {
      setLoading(false);
    }
  };

  // Filter available exams: not registered AND registration period open
  const now = new Date();
  const availableExams = exams.filter(exam => {
    const regStart = new Date(exam.registration_start_date);
    const regEnd = new Date(exam.registration_end_date);
    const isOpen = now >= regStart && now <= regEnd && exam.status === 'registration_open';
    const notRegistered = !registrations.some(reg => reg.admin_exam_id === exam.id);
    return isOpen && notRegistered;
  });

  const availableExamsCount = availableExams.length;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  const openAdmissionModal = async (reg) => {
    try {
      const res = await fetch(`/api/student/registrations/${reg.id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSelectedRegistration(data.registration);
        setShowAdmissionModal(true);
      } else {
        console.error('Failed to fetch registration details');
        // Fallback to basic reg if fetch fails
        setSelectedRegistration(reg);
        setShowAdmissionModal(true);
      }
    } catch (error) {
      console.error('Error fetching detailed registration:', error);
      // Fallback to basic reg if fetch fails
      setSelectedRegistration(reg);
      setShowAdmissionModal(true);
    }
  };

  const handleDownloadComplete = (regId) => {
    setDownloadedIds(prev => new Set([...prev, regId]));
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Access denied. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-700 to-gray-300 flex flex-col">
      <Navbar user={user} />
      
      {/* Success Notification */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 m-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
              {admissionNumber && (
                <p className="text-sm text-green-700 mt-1">
                  Your admission number: <span className="font-bold">{admissionNumber}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Logo Section */}
      <div className="flex flex-col items-center py-6">
        <div className="mb-4">
          <Image 
            src="/logo.png" 
            alt="Institute Logo" 
            width={120} 
            height={120}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-[120px] lg:h-[120px] object-contain"
          />
        </div>

        <div className="flex flex-col items-center mt-2">
          <Image 
            src="/sipsara.png" 
            alt="සිප්සර" 
            width={300} 
            height={80}
            className="w-48 h-12 sm:w-64 sm:h-16 md:w-80 md:h-20 lg:w-[300px] lg:h-[80px] object-contain"
          />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mt-3 text-black">
            අධ්‍යාපන ආයතනය
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/student/exams" className="bg-blue-500 text-white p-6 rounded-lg hover:bg-blue-600 transition">
            <h3 className="text-xl font-bold mb-2">Available Exams</h3>
            <p className="text-3xl">{availableExamsCount}</p>
          </Link>
          
          <Link href="/student/registrations" className="bg-green-500 text-white p-6 rounded-lg hover:bg-green-600 transition">
            <h3 className="text-xl font-bold mb-2">My Registrations</h3>
            <p className="text-3xl">{registrations.length}</p>
          </Link>
          
          <Link href="/student/results" className="bg-purple-500 text-white p-6 rounded-lg hover:bg-purple-600 transition">
            <h3 className="text-xl font-bold mb-2">Results</h3>
            <p className="text-3xl">View</p>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Available Exams</h2>
            {availableExams.length === 0 ? (
              <p className="text-gray-500">No exams available</p>
            ) : (
              <div className="space-y-4">
                {availableExams.slice(0, 3).map(exam => {
                  return (
                    <div key={exam.id} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold">{exam.exam_name}</h3>
                      <p className="text-sm text-gray-600">Grade: {exam.grade_name}</p>
                      <p className="text-sm text-gray-600">Date: {formatDate(exam.exam_date)}</p>
                      <p className="text-sm text-gray-600">Registration: {formatDate(exam.registration_start_date)} - {formatDate(exam.registration_end_date)}</p>
                      
                      <Link 
                        href={`/student/exams/register/${exam.id}`}
                        className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition text-sm"
                      >
                        Register
                      </Link>
                    </div>
                  );
                })}
                {availableExamsCount > 3 && (
                  <Link href="/student/exams" className="text-blue-600 hover:underline text-sm font-semibold">
                    View All Exams →
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">My Registrations</h2>
            {registrations.length === 0 ? (
              <p className="text-gray-500">You haven't registered for any exams yet</p>
            ) : (
              <div className="space-y-4">
                {registrations.slice(0, 3).map(reg => (
                  <div key={reg.id} className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded">
                    <h3 className="font-semibold text-green-900">{reg.exam_name}</h3>
                    <p className="text-sm text-gray-600">Status: <span className="font-semibold capitalize">{reg.registration_status}</span></p>
                    <p className="text-sm text-gray-600">Exam Status: <span className="font-semibold capitalize">{reg.exam_status}</span></p>
                    <p className="text-sm text-gray-600">Admission: <span className="font-mono font-bold">{reg.admission_number}</span></p>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Subjects:</span>
                    </p>
                    {reg.chosen_subjects ? (
                      <div className="flex flex-wrap gap-1">
                        {reg.chosen_subjects.split(', ').map((subject, idx) => (
                          <span key={idx} className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                            {subject}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">No subjects selected</p>
                    )}
                    {reg.exam_status === 'send_admission_cards' && (
                      <button
                        onClick={() => openAdmissionModal(reg)}
                        disabled={downloadedIds.has(reg.id)}
                        className={`mt-2 px-4 py-1 rounded transition text-sm font-semibold ${
                          downloadedIds.has(reg.id)
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {downloadedIds.has(reg.id) 
                          ? '✅ Admission Card Downloaded' 
                          : '📄 View & Download Admission Card'
                        }
                      </button>
                    )}
                  </div>
                ))}
                {registrations.length > 3 && (
                  <Link href="/student/registrations" className="text-green-600 hover:underline text-sm font-semibold">
                    View All Registrations →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Button - Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto flex justify-end">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition text-sm font-semibold"
          >
            🔒 Change Password
          </button>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)}
        user={user}
      />

      {showAdmissionModal && selectedRegistration && (
        <AdmissionCardGenerator 
          registration={selectedRegistration} 
          onClose={() => {
            setShowAdmissionModal(false);
            setSelectedRegistration(null);
          }}
          onDownload={() => handleDownloadComplete(selectedRegistration.id)} // New prop to notify on download
        />
      )}
    </div>
  );
}