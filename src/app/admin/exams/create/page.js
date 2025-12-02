// ============================================
// FILE: src/app/admin/exams/create/page.js
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAdminExam() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    exam_name: '',
    grade_ids: [],
    subject_ids: [],
    exam_date: '',
    registration_start_date: '',
    registration_end_date: '',
    description: '',
    status: 'draft'
  });

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch grades and subjects on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesRes, subjectsRes] = await Promise.all([
          fetch('/api/grades'),
          fetch('/api/subjects')
        ]);

        if (gradesRes.ok) {
          const gradesData = await gradesRes.json();
          setGrades(gradesData.grades || []);
        }

        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          setSubjects(subjectsData.subjects || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'grade_ids' || name === 'subject_ids') {
        setFormData(prev => ({
          ...prev,
          [name]: checked
            ? [...prev[name], parseInt(value)]
            : prev[name].filter(id => id !== parseInt(value))
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'same-origin'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create exam');
        setLoading(false);
        return;
      }

      // Redirect to admin dashboard with success message
      router.push('/admin/dashboard?success=Exam created successfully');
    } catch (err) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6">Create Exam</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Name *
            </label>
            <input
              type="text"
              name="exam_name"
              value={formData.exam_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="e.g., Mid-Term Exam 2025"
            />
          </div>

          {/* Grades */}
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Grades</label>

            <div className="grid grid-cols-2 gap-2 p-2 border rounded bg-gray-50">
              {grades.map((grade) => (
                <label key={grade.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={grade.id}
                    checked={formData.grade_ids.includes(String(grade.id))}
                    onChange={(e) => {
                      const id = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        grade_ids: [id]   // <-- only one selected
                      }));
                    }}
                    className="h-4 w-4"
                  />
                  <span>{grade.grade_name}</span>
                </label>
              ))}
            </div>
          </div>


          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subjects *
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 p-4 rounded-lg">
              {subjects.length > 0 ? (
                subjects.map(subject => (
                  <label key={subject.id} className="flex items-center">
                    <input
                      type="checkbox"
                      name="subject_ids"
                      value={subject.id}
                      checked={formData.subject_ids.includes(subject.id)}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-gray-700">{subject.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-gray-500">No subjects available</p>
              )}
            </div>
          </div>

          {/* Exam Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Date *
            </label>
            <input
              type="datetime-local"
              name="exam_date"
              value={formData.exam_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* Registration Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Start *
              </label>
              <input
                type="datetime-local"
                name="registration_start_date"
                value={formData.registration_start_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration End *
              </label>
              <input
                type="datetime-local"
                name="registration_end_date"
                value={formData.registration_end_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              rows="4"
              placeholder="Exam details and instructions..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}