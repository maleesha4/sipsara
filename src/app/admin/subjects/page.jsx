// ============================================
// FILE: src/app/admin/subjects/page.jsx (ManageSubjects - FIXED)
// ============================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ManageSubjects() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // FIXED: separate success state
  const [editingSubject, setEditingSubject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const createdMessage = searchParams.get('created');

  const debouncedSearch = useDebounce(search, 300);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
  });

  // Fetch subjects function
  const fetchSubjects = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      const res = await fetch(`/api/admin/subjects?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'same-origin'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch subjects');
      }

      setSubjects(data.subjects || []);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when search changes
  useEffect(() => {
    fetchSubjects(debouncedSearch);
  }, [fetchSubjects, debouncedSearch]);

  useEffect(() => {
    if (createdMessage) {
      const timer = setTimeout(() => router.replace('/admin/subjects'), 3000);
      return () => clearTimeout(timer);
    }
  }, [createdMessage, router]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Open edit modal
  const openEditModal = (subject) => {
    setEditingSubject({ ...subject });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);
  };

  // Handle edit submit - FIXED
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;

    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingSubject),
        credentials: 'same-origin'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update subject');
      }

      await fetchSubjects(debouncedSearch);
      closeModal();
      setSuccess('Subject updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete - FIXED
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject? This action cannot be undone and may affect existing data.')) return;
    setDeletingId(id);

    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
        credentials: 'same-origin'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete subject');
      }

      await fetchSubjects(debouncedSearch);
      setSuccess('Subject deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && subjects.length === 0) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <p className="text-lg">Loading subjects...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Subjects</h1>
        <Link href="/admin/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors">
          Back to Dashboard
        </Link>
      </div>

      {createdMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          Subject created successfully!
        </div>
      )}

      {/* FIXED: Success message */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md p-3 flex-1 sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Link
          href="/admin/subjects/create"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors"
        >
          Create Subject
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No subjects found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{sub.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(sub)}
                        className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        disabled={deletingId === sub.id}
                        className="bg-red-500 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        {deletingId === sub.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Subject</h2>
            <form onSubmit={handleEditSubmit}>
              <input type="hidden" value={editingSubject.id} />
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Subject Name</label>
                <input
                  type="text"
                  value={editingSubject.name || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}