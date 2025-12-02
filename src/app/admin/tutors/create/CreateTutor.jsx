// src/app/admin/tutors/create/CreateTutor.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateTutor() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    subjectId: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');  // Assume endpoint exists; implement if needed
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/create_tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Creation failed');
      }

      router.push('/admin/tutors?created=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">Create Tutor</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            >
              <option value="">Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Tutor'}
            </button>

            <Link
              href="/admin/tutors"
              className="w-1/2 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold text-center hover:bg-gray-400"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}