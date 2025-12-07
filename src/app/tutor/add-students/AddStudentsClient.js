// src/app/tutor/add-students/AddStudentsClient.js
'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default function AddStudentsClient() {
  const [user, setUser] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [error, setError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';  // Redirect if no token
      return;
    }
    loadData();
  }, []);  // Initial load only

  // Debounced load for filters (run on change, but not on mount)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchName || selectedGrade) loadData();
    }, 300);  // Debounce 300ms
    return () => clearTimeout(timer);
  }, [searchName, selectedGrade]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchUser(),
        fetchAvailableStudents()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
      if (!res.ok) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (data.user?.role !== 'tutor') {
        setError('Access denied: Tutor role required.');
        setTimeout(() => window.location.href = '/login', 1500);
        return;
      }
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      let url = '/api/tutor/enrollments/available';
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (selectedGrade) params.append('grade', selectedGrade);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch available students');
      }
      const data = await res.json();
      setAvailableStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching available students:', error);
      setError(error.message);
      setAvailableStudents([]);  // Clear on error
    }
  };

  const handleEnroll = async (studentId) => {
    if (!selectedGrade) {
      setError('Please select a grade before enrolling.');
      return;
    }
    try {
      const res = await fetch('/api/tutor/enrollments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ studentId, grade: selectedGrade })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Enrollment failed');
      }
      await loadData();  // Reload
      setError('');  // Clear errors on success
    } catch (error) {
      console.error('Error enrolling student:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Add Students</h1>
          <Link href="/tutor/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded">
            Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="border rounded p-2 flex-1"
          />
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">All Grades</option>
            <option value="6">Grade 6</option>
            <option value="7">Grade 7</option>
            <option value="8">Grade 8</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
          </select>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {availableStudents.length === 0 ? (
          <p className="text-gray-500">No available students found. Try adjusting filters.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <p className="text-sm text-gray-600">Found {availableStudents.length} students</p>
            </div>
            <ul className="divide-y">
              {availableStudents.map((student) => (
                <li key={student.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{student.full_name}</h3>
                    <p className="text-sm text-gray-600">{student.grade_name}</p>
                  </div>
                  <button
                    onClick={() => handleEnroll(student.id)}
                    disabled={loading}
                    className="bg-green-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                  >
                    Enroll
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}