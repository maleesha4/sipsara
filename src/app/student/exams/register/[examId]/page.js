// ============================================
// FILE: src/app/student/exams/register/[examId]/page.js
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";

export default function RegisterExam() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = params.examId;
  const [exam, setExam] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExam();
    fetchSubjects();
  }, [examId]);

  const fetchExam = async () => {
    try {
      const res = await fetch(`/api/student/exams/${examId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch exam');
      }
      const data = await res.json();
      setExam(data.exam);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`/api/student/exams/${examId}/subjects`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch subjects');
      }
      const data = await res.json();
      setAvailableSubjects(data.subjects);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleRegister = async () => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    try {
      setError('');
      setRegistering(true);
      const res = await fetch('/api/student/exams/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: parseInt(examId),
          subject_ids: selectedSubjects
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const errData = await res.json();
        throw new Error(errData.error || 'Registration failed');
      }

      const data = await res.json();
      
      // Redirect to dashboard with success message
      router.push(`/student/dashboard?success=registered&admission=${data.admission_number}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <div className="flex flex-col items-center pt-8">
        <div className="mb-4">
          <Image src="/logo.png" alt="Institute Logo" width={120} height={120} />
        </div>
        <Image src="/sipsara.png" alt="සිප්සර" width={300} height={80} />
        <h1 className="text-3xl font-bold mt-4">අධ්‍යාපන ආයතනය</h1>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">විභාගය සඳහා ලියාපදිංචිවීම</h1>
        
        {exam && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-2">{exam.exam_name}</h2>
            <p className="text-sm text-gray-500">{exam.grade_name}</p>
            <p className="text-sm text-gray-500">Exam Date: {new Date(exam.exam_date).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">Registration Period: {new Date(exam.registration_start_date).toLocaleDateString()} - {new Date(exam.registration_end_date).toLocaleDateString()}</p>
            <p className="text-gray-600 mt-4">{exam.description}</p>
          </div>
        )}
        
        {error && <p className="text-red-500 mb-4 p-4 bg-red-50 rounded">{error}</p>}
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">ඔබ සම්බන්ද වීමට බලාපොරොත්තු වන විෂයන් සියල්ල සලකුණු කරන්න</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 p-4 rounded">
            {availableSubjects.length > 0 ? (
              availableSubjects.map(subject => (
                <label key={subject.id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => handleSubjectChange(subject.id)}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-gray-700">{subject.name}</span>
                </label>
              ))
            ) : (
              <p className="text-gray-500">No subjects available</p>
            )}
          </div>
          
          <div className="mt-6 flex gap-4 justify-end">
            <button 
              onClick={() => router.back()} 
              disabled={registering}
              className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button 
              onClick={handleRegister} 
              disabled={selectedSubjects.length === 0 || registering}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded"
            >
              {registering ? 'Registering...' : `Register (${selectedSubjects.length} subjects)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}