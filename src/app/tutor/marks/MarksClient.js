// ============================================
// FILE: src/app/tutor/marks/MarksClient.js
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default function MarksClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');
  const [choices, setChoices] = useState([]);  // List of {choice_id, student_name, admission_number, subject_name, score, marked_at}
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeExam, setActiveExam] = useState(null);  // {id, name}
  const [availableExams, setAvailableExams] = useState([]);  // Fallback list if no examId
  const [editingChoice, setEditingChoice] = useState(null);  // choice_id in edit mode

  useEffect(() => {
    fetchUser();
    if (examId) {
      fetchChoices(examId);
    } else {
      fetchAvailableExams();
    }
  }, [examId]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchChoices = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tutor/marks?examId=${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch choices');
      }
      const data = await res.json();
      setChoices(data.choices || []);
      setActiveExam({ id, name: `Exam ${id}` });  // TODO: Fetch real exam name
    } catch (error) {
      console.error('Error fetching choices:', error);
      alert(error.message || 'Failed to load marks data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableExams = async () => {
    try {
      const res = await fetch('/api/tutor/exams');
      if (res.ok) {
        const data = await res.json();
        setAvailableExams(data.exams || []);
        if (data.exams.length > 0 && !examId) {
          const firstExamId = data.exams[0].id;
          router.push(`/tutor/marks?examId=${firstExamId}`);
        }
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSubmit = async (choiceId, score) => {
    if (!score || score < 0 || score > 100) {
      alert('Score must be between 0 and 100');
      return;
    }

    try {
      const res = await fetch('/api/tutor/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choiceId, score })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save mark');
      }
      // Update local state
      setChoices(prev => prev.map(c => 
        c.choice_id === choiceId 
          ? { ...c, score: parseInt(score), marked_at: new Date().toISOString() }
          : c
      ));
      setEditingChoice(null);
      alert('Mark updated successfully!');
    } catch (error) {
      console.error('Error submitting mark:', error);
      alert(error.message || 'Failed to save mark');
    }
  };

  const startEditing = (choiceId) => {
    setEditingChoice(choiceId);
  };

  const cancelEditing = () => {
    setEditingChoice(null);
  };

  const handleBulkSave = async () => {
    const unsavedChoices = choices.filter(c => !c.score);  // Only unsaved (no score)
    if (unsavedChoices.length === 0) {
      alert('No unsaved marks to add');
      return;
    }

    // Prompt for bulk score
    const bulkScore = prompt(`Enter score for all ${unsavedChoices.length} unsaved students (0-100):`);
    if (bulkScore === null || bulkScore < 0 || bulkScore > 100) {
      alert('Invalid score for bulk save');
      return;
    }

    try {
      for (const choice of unsavedChoices) {
        await handleMarkSubmit(choice.choice_id, bulkScore);
      }
      fetchChoices(examId);  // Refresh after bulk
    } catch (error) {
      alert('Bulk save failed: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading marks...</p>
        </div>
      </div>
    );
  }

  // If no exam selected and no available exams, show message
  if (!examId && availableExams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Enter Marks</h1>
          <p className="text-gray-500">No exams assigned to you yet. Check with admin for assignments.</p>
          <Link href="/tutor/dashboard" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show exam selection if no examId but exams available
  if (!examId) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Select Exam to Enter Marks</h1>
          <div className="bg-white rounded-lg shadow p-6">
            {availableExams.map(exam => (
              <div key={exam.id} className="border-b py-4 last:border-b-0">
                <h3 className="font-semibold">{exam.exam_name}</h3>
                <p className="text-sm text-gray-600 mb-2">Date: {new Date(exam.exam_date).toLocaleDateString()} | Grade: {exam.grade_name}</p>
                <div className="text-sm mb-2">
                  Students per subject: {Object.entries(exam.student_count_per_subject || {}).map(([sub, count]) => `${sub}: ${count}`).join(', ')}
                </div>
                <button
                  onClick={() => router.push(`/tutor/marks?examId=${exam.id}`)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Enter Marks for this Exam
                </button>
              </div>
            ))}
          </div>
          <Link href="/tutor/dashboard" className="mt-4 inline-block bg-gray-500 text-white px-4 py-2 rounded">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Enter Marks</h1>
          <div>
            <Link href="/tutor/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
              Back to Dashboard
            </Link>
            <button onClick={() => fetchChoices(examId)} className="bg-gray-500 text-white px-4 py-2 rounded">
              Refresh
            </button>
          </div>
        </div>

        {activeExam && (
          <p className="mb-4 text-gray-600">Exam: {activeExam.name} | <span className="font-semibold">Total Choices: {choices.length}</span></p>
        )}

        {choices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No students have selected your subjects for this exam yet. Check with admin for registrations.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Student Name</th>
                  <th className="px-4 py-2 text-left">Admission #</th>
                  <th className="px-4 py-2 text-left">Subject</th>
                  <th className="px-4 py-2 text-left">Marks</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {choices.map((choice) => (
                  <tr key={choice.choice_id} className="border-t">
                    <td className="px-4 py-2 font-medium">{choice.student_name}</td>
                    <td className="px-4 py-2">{choice.admission_number}</td>
                    <td className="px-4 py-2">{choice.subject_name}</td>
                    <td className="px-4 py-2">
                      {editingChoice === choice.choice_id ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={choice.score || ''}
                          onChange={(e) => {
                            setChoices(prev => prev.map(c => 
                              c.choice_id === choice.choice_id ? { ...c, score: e.target.value } : c
                            ));
                          }}
                          className="border rounded px-2 py-1 w-20"
                          autoFocus
                        />
                      ) : (
                        <span className={`px-2 py-1 rounded ${choice.score ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {choice.score || 'Not Marked'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingChoice === choice.choice_id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMarkSubmit(choice.choice_id, choice.score)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Update
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(choice.choice_id)}
                          className={`px-3 py-1 rounded text-sm ${choice.score ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        >
                          {choice.score ? 'Edit' : 'Add Mark'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <button
                onClick={handleBulkSave}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold"
              >
                Add All Marks ({choices.filter(c => !c.score).length} unsaved)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}