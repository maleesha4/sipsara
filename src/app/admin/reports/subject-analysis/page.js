// ============================================
// FILE: src/app/admin/reports/subject-analysis/page.js
// ============================================
'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function SubjectAnalysisReport() {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);

      const subjectsRes = await fetch('/api/admin/reports/subject-analysis');
      const subjectsData = await subjectsRes.json();
      setSubjects(subjectsData.subjects || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-blue-100 text-blue-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 35) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyLabel = (percentage) => {
    if (percentage >= 75) return 'Easy';
    if (percentage >= 60) return 'Moderate';
    if (percentage >= 50) return 'Average';
    if (percentage >= 35) return 'Difficult';
    return 'Very Difficult';
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">📚 Subject Analysis Report</h1>

        {/* Overall Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-500 text-white p-6 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Total Subjects</h3>
            <p className="text-4xl font-bold">{subjects.length}</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Avg Pass Rate</h3>
            <p className="text-4xl font-bold">
              {subjects.length > 0 
                ? (subjects.reduce((sum, s) => sum + parseFloat(s.pass_rate), 0) / subjects.length).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Easiest Subject</h3>
            <p className="text-lg font-bold">
              {subjects.length > 0 
                ? subjects.reduce((max, s) => parseFloat(s.avg_percentage) > parseFloat(max.avg_percentage) ? s : max, subjects[0])?.subject_name
                : 'N/A'}
            </p>
          </div>
          <div className="bg-red-500 text-white p-6 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Hardest Subject</h3>
            <p className="text-lg font-bold">
              {subjects.length > 0
                ? subjects.reduce((min, s) => parseFloat(s.avg_percentage) < parseFloat(min.avg_percentage) ? s : min, subjects[0])?.subject_name
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Detailed Subject Analysis */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Subject Performance Details</h2>
          </div>
          
          <div className="p-6">
            {subjects.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No data available</p>
            ) : (
              <div className="space-y-6">
                {subjects.map((subject, idx) => (
                  <div key={idx} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{subject.subject_name}</h3>
                        <p className="text-sm text-gray-600">Code: {subject.subject_code}</p>
                      </div>
                      <span className={`px-3 py-1 rounded font-semibold ${getDifficultyColor(subject.avg_percentage)}`}>
                        {getDifficultyLabel(subject.avg_percentage)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Avg Marks</p>
                        <p className="text-2xl font-bold text-blue-600">{subject.avg_marks}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Avg %</p>
                        <p className="text-2xl font-bold text-green-600">{subject.avg_percentage}%</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Highest</p>
                        <p className="text-2xl font-bold text-purple-600">{subject.highest_marks}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Lowest</p>
                        <p className="text-2xl font-bold text-orange-600">{subject.lowest_marks}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Pass Rate</p>
                        <p className="text-2xl font-bold text-teal-600">{subject.pass_rate}%</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold mb-2">Grade Distribution</p>
                        <div className="space-y-2">
                          {['A', 'B', 'C', 'S', 'W'].map(grade => {
                            const gradeCount = parseInt(subject[`grade_${grade.toLowerCase()}_count`] || 0);
                            const totalStudents = parseInt(subject.total_students);
                            const percentage = totalStudents > 0 ? (gradeCount / totalStudents * 100).toFixed(1) : 0;
                            
                            return (
                              <div key={grade} className="flex items-center gap-2">
                                <span className="w-8 font-semibold">{grade}:</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-6">
                                  <div
                                    className={`h-6 rounded-full flex items-center justify-end px-2 text-xs font-semibold text-white ${
                                      grade === 'A' ? 'bg-green-500' :
                                      grade === 'B' ? 'bg-blue-500' :
                                      grade === 'C' ? 'bg-yellow-500' :
                                      grade === 'S' ? 'bg-orange-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  >
                                    {percentage > 5 ? `${gradeCount} (${percentage}%)` : ''}
                                  </div>
                                </div>
                                {percentage <= 5 && (
                                  <span className="text-xs text-gray-600">{gradeCount}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-2">Statistics</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Students:</span>
                            <span className="font-semibold">{subject.total_students}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pass Count:</span>
                            <span className="font-semibold text-green-600">{subject.pass_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fail Count:</span>
                            <span className="font-semibold text-red-600">{subject.fail_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Exams Conducted:</span>
                            <span className="font-semibold">{subject.exam_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Print Button */}
        <button
          onClick={() => window.print()}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Print Report
        </button>
      </div>
    </div>
  );
}
