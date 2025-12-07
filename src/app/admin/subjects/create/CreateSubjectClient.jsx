// ============================================
// NEW FILE: src/app/admin/subjects/create/CreateSubjectClient.jsx
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CreateSubjectClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const createdMessage = searchParams.get('created');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
        credentials: 'same-origin'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Creation failed');
      }

      router.push('/admin/subjects?created=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (createdMessage) {
      const timer = setTimeout(() => router.replace('/admin/subjects'), 3000);
      return () => clearTimeout(timer);
    }
  }, [createdMessage, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">Create Subject</h1>

        {createdMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Subject created successfully!
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Subject'}
            </button>

            <Link
              href="/admin/subjects"
              className="w-1/2 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold text-center hover:bg-gray-400 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}