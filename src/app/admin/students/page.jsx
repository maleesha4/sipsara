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

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [error, setError] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch students function
  const fetchStudents = useCallback(async (query = '', grade = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (grade !== 'all') params.append('grade', grade);
      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch students');
      }

      setStudents(data.students || []);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchStudents(debouncedSearch, gradeFilter);
  }, [fetchStudents, debouncedSearch, gradeFilter]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Handle grade filter change
  const handleGradeFilterChange = (e) => {
    setGradeFilter(e.target.value);
  };

  // Open edit modal
  const openEditModal = (student) => {
    setEditingStudent({ ...student });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStudent),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update student');
      }

      // Refetch after update
      await fetchStudents(debouncedSearch, gradeFilter);
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;

    try {
      const res = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete student');
      }

      // Refetch after delete
      await fetchStudents(debouncedSearch, gradeFilter);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <p className="text-lg">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Students</h1>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md p-3 flex-1 sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={gradeFilter}
          onChange={handleGradeFilterChange}
          className="border border-gray-300 rounded-md p-3 sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Grades</option>
          <option value="6">Grade 6</option>
          <option value="7">Grade 7</option>
          <option value="8">Grade 8</option>
          <option value="9">Grade 9</option>
          <option value="10">Grade 10</option>
          <option value="11">Grade 11</option>
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
      ) : students.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No students found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">DOB</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Parent Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{s.full_name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{s.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      s.status === 'active' ? 'bg-green-100 text-green-800' :
                      s.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{s.grade_name || s.grade}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{s.gender}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{s.date_of_birth}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">{s.parent_name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
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
      {showModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Student</h2>
            <form onSubmit={handleEditSubmit}>
              <input type="hidden" value={editingStudent.id} />
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingStudent.full_name || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editingStudent.email || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Grade</label>
                <select
                  value={editingStudent.grade || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, grade: e.target.value })}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  value={editingStudent.gender || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editingStudent.date_of_birth || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, date_of_birth: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={editingStudent.address || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                  className="w-full border rounded-md p-2"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Parent Name</label>
                <input
                  type="text"
                  value={editingStudent.parent_name || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parent_name: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Profile Photo URL</label>
                <input
                  type="url"
                  value={editingStudent.profile_photo || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, profile_photo: e.target.value })}
                  className="w-full border rounded-md p-2"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingStudent.status || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
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