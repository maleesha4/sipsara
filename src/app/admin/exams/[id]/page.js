// ============================================
// FILE: src/app/admin/exams/[id]/page.js
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import Link from 'next/link';
import EditExamForm from '../../../../components/EditExamForm';
import TutorAssignmentModal from '../../../../components/TutorAssignmentModal';

export default function ManageAdminExam() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id;
  const [exam, setExam] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [currentSubjects, setCurrentSubjects] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [publishStatus, setPublishStatus] = useState({ total_choices: 0, marked_choices: 0, ready_to_publish: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [grades, setGrades] = useState([]);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [editingSubjects, setEditingSubjects] = useState([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [addingStudents, setAddingStudents] = useState(false);

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const examRes = await fetch(`/api/admin/exams/${examId}`);
      if (!examRes.ok) {
        if (examRes.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch exam data');
      }
      const examData = await examRes.json();
      setExam(examData.exam);

      const currentSubjectsRes = await fetch(`/api/admin/exams/${examId}/subjects`);
      if (currentSubjectsRes.ok) {
        const currentSubjectsData = await currentSubjectsRes.json();
        setCurrentSubjects(currentSubjectsData.subjects || []);
      }

      const allSubjectsRes = await fetch('/api/subjects');
      if (allSubjectsRes.ok) {
        const allSubjectsData = await allSubjectsRes.json();
        setAllSubjects(allSubjectsData.subjects || []);
      }

      const allTutorsRes = await fetch('/api/admin/tutors');
      if (allTutorsRes.ok) {
        const allTutorsData = await allTutorsRes.json();
        setAllTutors(allTutorsData.tutors || []);
      }

      const regsRes = await fetch(`/api/admin/exams/${examId}/students`);
      if (regsRes.ok) {
        const regsData = await regsRes.json();
        setRegistrations(regsData.registrations || []);
      } else {
        console.error('Failed to fetch registrations:', regsRes.status);
        setRegistrations([]);
      }

      const publishRes = await fetch(`/api/admin/exams/${examId}/publish-status`);
      if (publishRes.ok) {
        const publishData = await publishRes.json();
        setPublishStatus(publishData || { total_choices: 0, marked_choices: 0, ready_to_publish: false });
      }

      const gradesRes = await fetch('/api/grades');
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGrades(gradesData.grades || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/available-students`);
      if (res.ok) {
        const data = await res.json();
        setAvailableStudents(data.available_students || []);
      } else {
        console.error('Failed to fetch available students');
      }
    } catch (err) {
      console.error('Error fetching available students:', err);
    }
  };

  const openAddStudentModal = async () => {
    await fetchAvailableStudents();
    setSelectedStudentIds([]);
    setShowAddStudentModal(true);
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const addSelectedStudents = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student');
      return;
    }

    try {
      setAddingStudents(true);
      const res = await fetch(`/api/admin/exams/${examId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: selectedStudentIds })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Students added successfully');
        setShowAddStudentModal(false);
        fetchData();
      } else {
        const errData = await res.json();
        alert('Error: ' + (errData.error || 'Failed to add students'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAddingStudents(false);
    }
  };

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    setEditingRegistration(null);
  };

  const handleSave = () => {
    fetchData();
    setEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const removeSubject = async (subjectId) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/subjects/${subjectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (err) {
      setError('Failed to remove subject');
    }
  };

  const deleteExam = async () => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/admin/exams');
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (err) {
      setError('Failed to delete exam');
    }
  };

  const publishResults = async () => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/publish`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        alert('Results published!');
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (err) {
      setError('Failed to publish results');
    }
  };

  const openTutorAssignment = () => setShowTutorModal(true);

  const handleEditRegistrationSubjects = (registration) => {
    setEditingRegistration(registration.id);
    const subjectIds = registration.subject_ids || [];
    setEditingSubjects(subjectIds);
  };

  const handleSubjectToggle = (subjectId) => {
    setEditingSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const saveRegistrationSubjects = async () => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/students/${editingRegistration}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_ids: editingSubjects
        })
      });

      if (res.ok) {
        alert('Subjects updated successfully');
        setEditingRegistration(null);
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to update subjects');
      }
    } catch (err) {
      setError('Error updating subjects: ' + err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  );
  
  if (error && !exam) return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">Error: {error}</p>
        <Link href="/admin/exams" className="text-blue-600 hover:underline">Back to Exams</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{editing ? 'Edit Exam' : exam?.exam_name}</h1>
          {!editing && (
            <div className="flex gap-2">
              <button 
                onClick={openTutorAssignment} 
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Assign Tutors
              </button>
              <button 
                onClick={handleEdit} 
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
              >
                Edit Exam
              </button>
              <button 
                onClick={deleteExam} 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Delete Exam
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 text-orange-800">
            {error}
          </div>
        )}

        {editing && (
          <EditExamForm
            exam={exam}
            allSubjects={allSubjects}
            grades={grades}
            onSave={handleSave}
            onCancel={handleCancel}
            currentSubjects={currentSubjects}
            allTutors={allTutors}
            examId={examId}
          />
        )}

        <TutorAssignmentModal
          isOpen={showTutorModal}
          onClose={() => setShowTutorModal(false)}
          examId={examId}
          currentSubjects={currentSubjects}
          allTutors={allTutors}
          allSubjects={allSubjects}
          onSave={fetchData}
        />

        {showAddStudentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Add Students to Exam</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Select students from Grade {exam?.grade_name || 'N/A'} who are not yet registered:</p>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {availableStudents.length === 0 ? (
                  <p className="text-gray-500 text-center">No available students in this grade</p>
                ) : (
                  availableStudents.map((student) => (
                    <label key={student.student_id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.student_id)}
                        onChange={() => handleStudentToggle(student.student_id)}
                        className="mr-2 w-4 h-4"
                      />
                      <span className="font-medium">{student.student_name}</span>
                      <span className="text-xs text-gray-500 ml-2">({student.student_email})</span>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                  disabled={addingStudents}
                >
                  Cancel
                </button>
                <button
                  onClick={addSelectedStudents}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  disabled={addingStudents || selectedStudentIds.length === 0}
                >
                  {addingStudents ? 'Adding...' : `Add ${selectedStudentIds.length} Student${selectedStudentIds.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Exam Subjects</h2>
          <div className="space-y-2 mb-4">
            {currentSubjects.map(sub => (
              <div key={sub.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-semibold">{sub.name}</span>
                {!editing && (
                  <button 
                    onClick={() => removeSubject(sub.id)} 
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Publish Results</h2>
          <div className="mb-4">
            <p className="text-gray-700">Total Choices: <span className="font-bold">{publishStatus.total_choices}</span></p>
            <p className="text-gray-700">Marked: <span className="font-bold">{publishStatus.marked_choices}</span></p>
            <p className="text-gray-700 mt-2">
              Status: 
              <span className={`ml-2 font-bold ${publishStatus.ready_to_publish ? 'text-green-600' : 'text-orange-600'}`}>
                {publishStatus.ready_to_publish ? '✓ Ready to Publish' : '✗ Not Ready'}
              </span>
            </p>
          </div>
          {exam?.status === 'completed' && publishStatus.ready_to_publish && (
            <button 
              onClick={publishResults} 
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition font-semibold"
            >
              Publish Results
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Registered Students ({registrations.length})</h2>
            {!editing && (
              <button 
                onClick={openAddStudentModal} 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Add Students
              </button>
            )}
          </div>
          
          {registrations.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded text-center">
              <p className="text-gray-500 text-lg">No students registered yet</p>
              {!editing && (
                <button 
                  onClick={openAddStudentModal} 
                  className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
                >
                  Add Students Now
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-3 text-left font-semibold">Student Name</th>
                    <th className="border p-3 text-left font-semibold">Index #</th>
                    <th className="border p-3 text-left font-semibold">Email</th>
                    <th className="border p-3 text-left font-semibold">Admission #</th>
                    <th className="border p-3 text-left font-semibold">Registered Date</th>
                    <th className="border p-3 text-left font-semibold">Status</th>
                    <th className="border p-3 text-left font-semibold">Selected Subjects</th>
                    <th className="border p-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, idx) => (
                    <tr key={reg.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border p-3 font-semibold">{reg.student_name}</td>
                      <td className="border p-3 text-xs">{reg.index_number || 'N/A'}</td>
                      <td className="border p-3 text-xs text-blue-600">{reg.student_email}</td>
                      <td className="border p-3 font-mono font-bold text-blue-700">{reg.admission_number}</td>
                      <td className="border p-3 text-xs">{formatDate(reg.registration_date)}</td>
                      <td className="border p-3">
                        <span className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                          reg.status === 'registered' ? 'bg-yellow-100 text-yellow-800' :
                          reg.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="border p-3">
                        {editingRegistration === reg.id ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 p-2 rounded bg-gray-50">
                            {currentSubjects.map(subject => (
                              <label key={subject.id} className="flex items-center p-1 hover:bg-white rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingSubjects.includes(subject.id)}
                                  onChange={() => handleSubjectToggle(subject.id)}
                                  className="mr-2 w-4 h-4"
                                />
                                <span className="text-xs font-medium">{subject.name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {reg.chosen_subjects ? (
                              reg.chosen_subjects.split(', ').map((subject, sidx) => (
                                <span key={sidx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                  {subject}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs italic">No subjects</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="border p-3">
                        {editingRegistration === reg.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={saveRegistrationSubjects}
                              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingRegistration(null)}
                              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditRegistrationSubjects(reg)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition font-semibold"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4 justify-end">
          <Link
            href="/admin/dashboard"
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/admin/exams"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Back to Exams
          </Link>
        </div>
      </div>
    </div>
  );
}