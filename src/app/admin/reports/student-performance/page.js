// ============================================
// FILE: src/app/admin/reports/student-performance/page.js
// ============================================
'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function StudentPerformanceReport() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);

      const studentsRes = await fetch('/api/admin/reports/students');
      const studentsData = await studentsRes.json();
      setStudents(studentsData.students || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = async (studentId) => {
    setSelectedStudent(studentId);
    try {
      const res = await fetch(`/api/admin/reports/student-performance/${studentId}`);
      const data = await res.json();
      setStudentData(data);
    } catch (error) {
      console.error('Error:', error);
    }
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
        <h1 className="text-3xl font-bold mb-6">Student Performance Report</h1>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Student List */}
          <div className="bg-white rounded-lg shadow p-4 h-fit">
            <h2 className="text-lg font-bold mb-4">Select Student</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student.id)}
                  className={`w-full text-left p-3 rounded border transition ${
                    selectedStudent === student.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <p className="font-semibold">{student.full_name}</p>
                  <p className="text-sm text-gray-600">{student.index_number}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Student Performance Details */}
          <div className="md:col-span-3">
            {!studentData ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">Select a student to view performance report</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">{studentData.student.full_name}</h2>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Index Number</p>
                      <p className="font-semibold">{studentData.student.index_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Exams</p>
                      <p className="font-semibold text-2xl text-blue-600">{studentData.stats.total_exams}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Percentage</p>
                      <p className="font-semibold text-2xl text-green-600">{studentData.stats.avg_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Rank</p>
                      <p className="font-semibold text-2xl text-purple-600">#{studentData.stats.avg_rank}</p>
                    </div>
                  </div>
                </div>

                {/* Exam History */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-4">Exam History</h3>
                  <div className="space-y-4">
                    {studentData.exams.map((exam, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold">{exam.exam_name}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(exam.exam_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{exam.percentage}%</p>
                            <p className="text-sm text-gray-600">Rank: #{exam.overall_rank}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {exam.subject_results.map((result, ridx) => (
                            <div key={ridx} className="text-center p-2 bg-gray-50 rounded">
                              <p className="text-xs text-gray-600">{result.subject_name}</p>
                              <p className="font-semibold">{result.marks_obtained}/{result.max_marks}</p>
                              <span className={`text-xs px-2 py-1 rounded ${
                                result.grade === 'A' ? 'bg-green-100 text-green-800' :
                                result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                result.grade === 'S' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.grade}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject-wise Performance */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-4">Subject-wise Average Performance</h3>
                  <div className="space-y-3">
                    {studentData.subject_averages.map((subject, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold">{subject.subject_name}</span>
                            <span className="text-gray-600">{subject.avg_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                subject.avg_percentage >= 75 ? 'bg-green-500' :
                                subject.avg_percentage >= 65 ? 'bg-blue-500' :
                                subject.avg_percentage >= 50 ? 'bg-yellow-500' :
                                subject.avg_percentage >= 35 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${subject.avg_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Print Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

