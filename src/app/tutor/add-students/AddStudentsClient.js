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

  useEffect(() => {
    loadData();
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
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data.user);
  };

  const fetchAvailableStudents = async () => {
    try {
      let url = '/api/tutor/enrollments/available';
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (selectedGrade) params.append('grade', selectedGrade);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch available students');
      const data = await res.json();
      setAvailableStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching available students:', error);
      setError('Failed to fetch available students.');
    }
  };

  const handleEnroll = async (studentId) => {
    try {
      const res = await fetch('/api/tutor/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, grade: selectedGrade })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Enrollment failed');
      }
      await loadData();  // Reload all
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
        </div>

        {availableStudents.length === 0 ? (
          <p className="text-gray-500">No available students.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <ul className="divide-y">
              {availableStudents.map((student) => (
                <li key={student.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{student.full_name}</h3>
                    <p className="text-sm text-gray-600">{student.grade_name}</p>
                  </div>
                  <button
                    onClick={() => handleEnroll(student.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded text-sm"
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