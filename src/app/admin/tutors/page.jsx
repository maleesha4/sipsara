'use client';

import { useState, useEffect, useCallback } from 'react';

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

export default function ManageTutors() {
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);  // For edit modal
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);
  const [editingTutor, setEditingTutor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch tutors function
  const fetchTutors = useCallback(async (query = '', status = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (status !== 'all') params.append('status', status);
      const res = await fetch(`/api/admin/tutors?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch tutors');
      }

      setTutors(data.tutors || []);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch subjects for edit modal
  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchTutors(debouncedSearch, statusFilter);
    fetchSubjects();
  }, [fetchTutors, debouncedSearch, statusFilter]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Open edit modal
  const openEditModal = (tutor) => {
    setEditingTutor({ ...tutor });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingTutor(null);
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTutor) return;

    try {
      const res = await fetch('/api/admin/tutors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTutor),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update tutor');
      }

      // Refetch after update
      await fetchTutors(debouncedSearch, statusFilter);
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tutor? This action cannot be undone.')) return;

    try {
      const res = await fetch('/api/admin/tutors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete tutor');
      }

      // Refetch after delete
      await fetchTutors(debouncedSearch, statusFilter);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && tutors.length === 0) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <p className="text-lg">Loading tutors...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Tutors</h1>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md p-3 flex-1 sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="border border-gray-300 rounded-md p-3 sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
          onClick={() => window.location.href = '/admin/dashboard'}
        >
          Back to Dashboard
        </button>
      </div>

      {error ? (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          Error: {error}
        </div>
      ) : tutors.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No tutors found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Joined Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tutors.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{t.full_name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{t.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      t.status === 'active' ? 'bg-green-100 text-green-800' :
                      t.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{t.specialization}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{t.phone}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{t.joined_date}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(t)}
                        className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Delete
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
      {showModal && editingTutor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Tutor</h2>
            <form onSubmit={handleEditSubmit}>
              <input type="hidden" value={editingTutor.id} />
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingTutor.full_name || ''}
                  onChange={(e) => setEditingTutor({ ...editingTutor, full_name: e.target.value })}
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editingTutor.email || ''}
                  onChange={(e) => setEditingTutor({ ...editingTutor, email: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={editingTutor.phone || ''}
                  onChange={(e) => setEditingTutor({ ...editingTutor, phone: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Subject</label>
                <select
                  value={editingTutor.specialization || ''}
                  onChange={(e) => setEditingTutor({ ...editingTutor, specialization: e.target.value })}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingTutor.status || ''}
                  onChange={(e) => setEditingTutor({ ...editingTutor, status: e.target.value })}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
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