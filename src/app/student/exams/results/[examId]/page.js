// ============================================
// FILE: src/app/student/exams/results/[examId]/page.js
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../../../components/Navbar';

export default function ExamResults() {
  const params = useParams();
  const examId = params.examId;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/student/exams/${examId}/results`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Exam Results</h1>
        <table className="w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left">Subject</th>
              <th className="p-3 text-left">Score</th>
              <th className="p-3 text-left">Comments</th>
            </tr>
          </thead>
          <tbody>
            {results.map(result => (
              <tr key={result.subject_id} className="border-t">
                <td className="p-3">{result.subject_name}</td>
                <td className="p-3">{result.score || 'Pending'}</td>
                <td className="p-3">{result.comments || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}