// ============================================
// FILE: src/app/admin/exams/page.js
// ============================================
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar'; // Adjust path as needed

export default function AdminExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/admin/exams');
      const data = await res.json();
      setExams(data.exams || []);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Exams</h1>
          <Link href="/admin/exams/create" className="bg-blue-500 text-white px-4 py-2 rounded">
            Create New Exam
          </Link>
        </div>
        <table className="w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Grade</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Registrations</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map(exam => (
              <tr key={exam.id} className="border-t">
                <td className="p-3">{exam.exam_name}</td>
                <td className="p-3">{exam.grade_name}</td>
                <td className="p-3">{new Date(exam.exam_date).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${exam.status === 'published' ? 'bg-green-200' : 'bg-yellow-200'}`}>
                    {exam.status}
                  </span>
                </td>
                <td className="p-3">{exam.registration_count || 0}</td>
                <td className="p-3">
                  <Link href={`/admin/exams/${exam.id}`} className="text-blue-500 hover:underline mr-2">
                    Manage
                  </Link>
                  <Link href={`/admin/exams/${exam.id}/marks`} className="text-green-500 hover:underline">
                    View Marks
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}