'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function TopPerformersReport() {
  const [user, setUser] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('all');
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchTopPerformers();
    }
  }, [selectedExam]);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);

      const examsRes = await fetch('/api/admin/exams');
      const examsData = await examsRes.json();
      setExams(examsData.exams || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPerformers = async () => {
    try {
      const res = await fetch(`/api/admin/reports/top-performers?examId=${selectedExam}`);
      const data = await res.json();
      setTopPerformers(data.performers || []);
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
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">🏆 Top Performers</h1>

        {/* Exam Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Select Exam</label>
          <select
            className="w-full md:w-1/2 px-3 py-2 border rounded-lg"
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <option value="all">All Exams (Overall)</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.exam_name}
              </option>
            ))}
          </select>
        </div>

        {/* Top Performers List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">
              {selectedExam === 'all' ? 'Overall Top Performers' : 'Exam Top Performers'}
            </h2>
            <p className="text-gray-600">Top 50 students by performance</p>
          </div>
          
          <div className="p-6">
            {topPerformers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No results available</p>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((student, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      idx === 0 ? 'bg-yellow-50 border-yellow-400' :
                      idx === 1 ? 'bg-gray-50 border-gray-400' :
                      idx === 2 ? 'bg-orange-50 border-orange-400' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl font-bold ${
                        idx === 0 ? 'text-yellow-600' :
                        idx === 1 ? 'text-gray-600' :
                        idx === 2 ? 'text-orange-600' :
                        'text-gray-400'
                      }`}>
                        {idx < 3 ? (
                          idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
                        ) : (
                          `#${idx + 1}`
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{student.full_name}</h3>
                        <p className="text-sm text-gray-600">
                          Index: {student.index_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {student.avg_percentage}%
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedExam === 'all' 
                          ? `${student.exam_count} exams` 
                          : `Total: ${student.total_marks}`}
                      </p>
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
          Print Leaderboard
        </button>
      </div>
    </div>
  );
}