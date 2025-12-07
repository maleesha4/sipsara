// ============================================
// FILE: components/EditExamForm.js (FIXED DATE FORMATTING)
// ============================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`
});

export default function EditExamForm({ exam, allSubjects, grades, onSave, onCancel, currentSubjects, allTutors, examId }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    exam_name: exam.exam_name || '',
    grade_id: exam.grade_id || '',
    exam_date: exam.exam_date ? new Date(exam.exam_date).toISOString().split('T')[0] : '',
    registration_start_date: exam.registration_start_date ? new Date(exam.registration_start_date).toISOString().split('T')[0] : '',
    registration_end_date: exam.registration_end_date ? new Date(exam.registration_end_date).toISOString().split('T')[0] : '',
    description: exam.description || '',
    status: exam.status || 'draft',
    subject_ids: currentSubjects.map(s => s.id)
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter(id => id !== subjectId)
        : [...prev.subject_ids, subjectId]
    }));
  };

  const handleSave = async () => {
    try {
      setError('');
      setSaving(true);
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          exam_name: formData.exam_name,
          grade_id: formData.grade_id,
          exam_date: formData.exam_date,
          registration_start_date: formData.registration_start_date,
          registration_end_date: formData.registration_end_date,
          description: formData.description,
          status: formData.status,
          subject_ids: formData.subject_ids
        }),
        credentials: 'same-origin'
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update exam');
      }
      onSave(); // Refresh parent
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold mb-2">Exam Name</label>
          <input
            type="text"
            name="exam_name"
            value={formData.exam_name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Grade *</label>
          <select
            name="grade_id"
            value={formData.grade_id}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Grade</option>
            {grades.map(grade => (
              <option key={grade.id} value={grade.id}>{grade.grade_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Exam Date *</label>
          <input
            type="date"
            name="exam_date"
            value={formData.exam_date}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Registration Start Date *</label>
          <input
            type="date"
            name="registration_start_date"
            value={formData.registration_start_date}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Registration End Date *</label>
          <input
            type="date"
            name="registration_end_date"
            value={formData.registration_end_date}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            <option value="draft">Draft</option>
            <option value="registration_open">Open Registration</option>
            <option value="closed">Closed Registration</option>
            <option value="closed">Send Admission Cards</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subjects *
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 p-4 rounded-lg">
            {allSubjects.length > 0 ? (
              allSubjects.map(subject => (
                <label key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    value={subject.id}
                    checked={formData.subject_ids.includes(subject.id)}
                    onChange={(e) => handleSubjectChange(subject.id)}
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
      </div>
      <div className="mt-6 flex space-x-4">
        <button 
          type="button" 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}