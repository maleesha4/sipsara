// src/app/tutor/remove-students/RemoveStudentsClient.js
'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default function RemoveStudentsClient() {
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [searchName, selectedGrade]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchUser(),
        fetchEnrollments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data.user);
  };

  const fetchEnrollments = async () => {
    try {
      let url = '/api/tutor/enrollments';
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (selectedGrade) params.append('grade', selectedGrade);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      const data = await res.json();
      setEnrollments(data.enrollments || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setError('Failed to fetch enrolled students.');
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    if (!confirm('Unenroll this student?')) return;
    try {
      const res = await fetch(`/api/tutor/enrollments/${enrollmentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Unenroll failed');
      }
      await loadData();  // Reload all
    } catch (error) {
      console.error('Error unenrolling student:', error);
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
          <h1 className="text-3xl font-bold">Remove Students</h1>
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
        </div>

        {enrollments.length === 0 ? (
          <p className="text-gray-500">No enrolled students to remove.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <ul className="divide-y">
              {enrollments.map((enr) => (
                <li key={enr.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{enr.student_name}</h3>
                    <p className="text-sm text-gray-600">{enr.grade_name}</p>
                  </div>
                  <button
                    onClick={() => handleUnenroll(enr.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded text-sm"
                  >
                    Unenroll
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