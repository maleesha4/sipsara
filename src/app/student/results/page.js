// ============================================
// FILE: src/app/student/results/page.js
// ============================================
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StudentResultsPage() {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getGrade = (percentage) => {
    if (percentage >= 75) return 'A';
    if (percentage >= 65) return 'B';
    if (percentage >= 55) return 'C';
    if (percentage >= 35) return 'S';
    return 'F';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'S': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);

    if (!admissionNumber.trim()) {
      setError('Please enter your admission number');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/student/results?admission=${admissionNumber.trim()}`, {
        credentials: 'same-origin'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch results');
      }

      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setAdmissionNumber('');
    setResults(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {!results ? (
        // Admission Number Form
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">View Your Results</h1>
              <p className="text-gray-600">Enter your admission number to see your exam results</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="admission" className="block text-sm font-semibold text-gray-700 mb-2">
                  Admission Number
                </label>
                <input
                  type="text"
                  id="admission"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                  placeholder="Enter your admission number"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Example: 25012301
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !admissionNumber.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading...
                  </span>
                ) : (
                  'View Results'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      ) : (
        // Results Sheet - Printable
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Action Buttons - Hide on print */}
          <div className="print:hidden flex gap-4 justify-end mb-6">
            <button
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Check Another Result
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Save as PDF
            </button>
          </div>

          {/* Result Sheet - Printable */}
          <div className="bg-white rounded-lg shadow-2xl p-8 print:shadow-none print:rounded-none relative">
            {/* Header with Certificate Badge */}
            <div className="text-center mb-8 border-b-4 border-blue-600 pb-6 relative">
              <div className="flex items-center justify-center gap-8">
                {/* Left Badge */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Star badge shape */}
                    <defs>
                      <radialGradient id="badgeGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style={{ stopColor: '#DC2626', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#991B1B', stopOpacity: 1 }} />
                      </radialGradient>
                    </defs>
                    {/* Star points */}
                    <path d="M50,5 L57,35 L87,35 L63,53 L70,83 L50,65 L30,83 L37,53 L13,35 L43,35 Z" 
                          fill="url(#badgeGradient)" stroke="#7F1D1D" strokeWidth="1"/>
                    {/* Inner circle */}
                    <circle cx="50" cy="50" r="25" fill="#DC2626" stroke="#991B1B" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="20" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1"/>
                    {/* Text */}
                    <text x="50" y="48" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">CERTIFIED</text>
                    <text x="50" y="56" textAnchor="middle" fill="white" fontSize="6">RESULTS</text>
                  </svg>
                </div>
                
                {/* Title */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">SIPSARA INSTITUTE</h1>
                  <h2 className="text-xl font-semibold text-blue-600">EXAMINATION RESULTS</h2>
                </div>
                
                {/* Right Badge */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <radialGradient id="badgeGradient2" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style={{ stopColor: '#DC2626', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#991B1B', stopOpacity: 1 }} />
                      </radialGradient>
                    </defs>
                    <path d="M50,5 L57,35 L87,35 L63,53 L70,83 L50,65 L30,83 L37,53 L13,35 L43,35 Z" 
                          fill="url(#badgeGradient2)" stroke="#7F1D1D" strokeWidth="1"/>
                    <circle cx="50" cy="50" r="25" fill="#DC2626" stroke="#991B1B" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="20" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1"/>
                    <text x="50" y="48" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">CERTIFIED</text>
                    <text x="50" y="56" textAnchor="middle" fill="white" fontSize="6">RESULTS</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="mb-6 bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Student Name: </span>
                  <span className="text-lg font-bold text-gray-800">{results.student_name}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Examination: </span>
                  <span className="text-lg font-semibold text-gray-800">{results.exam_name}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Admission Number: </span>
                  <span className="text-lg font-bold text-blue-600 font-mono">{results.admission_number}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Grade: </span>
                  <span className="text-lg font-semibold text-gray-800">{results.grade_name}</span>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Subject-wise Performance</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Subject</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Marks</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Percentage</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {results.subjects.map((subject, index) => {
                    const percentage = subject.score;
                    const grade = getGrade(percentage);
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-3 font-medium">
                          {subject.subject_name}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                          {subject.score !== null ? subject.score : 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                          {percentage !== null ? `${percentage}%` : 'N/A'}
                        </td>
                        <td className={`border border-gray-300 px-4 py-3 text-center font-bold text-xl ${getGradeColor(grade)}`}>
                          {percentage !== null ? grade : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Grade Legend */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-2">Grade Classification:</h4>
              <div className="grid grid-cols-5 gap-2 text-sm">
                <div className="text-center">
                  <span className="font-bold text-green-600">A</span>
                  <p className="text-xs text-gray-600">75-100%</p>
                </div>
                <div className="text-center">
                  <span className="font-bold text-blue-600">B</span>
                  <p className="text-xs text-gray-600">65-74%</p>
                </div>
                <div className="text-center">
                  <span className="font-bold text-yellow-600">C</span>
                  <p className="text-xs text-gray-600">55-64%</p>
                </div>
                <div className="text-center">
                  <span className="font-bold text-orange-600">S</span>
                  <p className="text-xs text-gray-600">35-54%</p>
                </div>
                <div className="text-center">
                  <span className="font-bold text-red-600">F</span>
                  <p className="text-xs text-gray-600">0-34%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 0.5in;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}