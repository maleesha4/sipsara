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
  const [choices, setChoices] = useState([]);  // List of {choice_id, student_name, admission_number, subject_name, score, marked_at, exam_name, ...}
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeExam, setActiveExam] = useState(null);  // {id, name, date, grade_name}
  const [availableExams, setAvailableExams] = useState([]);  // Fallback list if no examId
  const [examsLoaded, setExamsLoaded] = useState(false);
  const [editingChoice, setEditingChoice] = useState(null);  // choice_id in edit mode
  const [pendingScores, setPendingScores] = useState({});  // {choice_id: scoreStr}
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');  // For save feedback

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUser();
    fetchAvailableExams();
  }, []);  // Run once on mount

  useEffect(() => {
    if (examId && examsLoaded) {
      fetchChoices(examId);
    }
  }, [examId, examsLoaded]);

  useEffect(() => {
    setEditingChoice(null);
    setPendingScores({});
  }, [examId]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
      if (!res.ok) {
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.user?.role !== 'tutor') {
        setError('Access denied: Tutor role required.');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('auth_token');
      router.push('/login');
    }
  };

  const fetchChoices = async (id) => {
    const exam = availableExams.find(e => String(e.id) === id);
    if (!exam) {
      setError('Selected exam not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tutor/marks?examId=${id}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch choices');
      }
      const data = await res.json();
      let allChoices = data.choices || [];
      // Additional frontend filtering to ensure only the selected exam's choices are shown
      allChoices = allChoices.filter(c => c.exam_name === exam.exam_name);
      setChoices(allChoices);
      setActiveExam({ 
        id: exam.id, 
        name: exam.exam_name, 
        date: exam.exam_date, 
        grade_name: exam.grade_name 
      });
    } catch (error) {
      console.error('Error fetching choices:', error);
      setError(error.message || 'Failed to load marks data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableExams = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tutor/exams', { headers: getAuthHeaders() });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch exams');
      }
      const data = await res.json();
      setAvailableExams(data.exams || []);
      // Removed auto-redirect to first exam to allow selection
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError(error.message || 'Failed to load available exams');
    } finally {
      setLoading(false);
      setExamsLoaded(true);
    }
  };

  const handleMarkSubmit = async (choiceId, scoreStr) => {
    setError('');
    if (!scoreStr || scoreStr.trim() === '') {
      setError('Score cannot be empty');
      return;
    }
    const score = parseInt(scoreStr);
    if (isNaN(score) || score < 0 || score > 100) {
      setError('Invalid score (0-100)');
      return;
    }
    try {
      const res = await fetch('/api/tutor/marks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ choiceId, score })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save mark');
      }
      // Update local state
      setChoices(prev => prev.map(c => 
        c.choice_id === choiceId 
          ? { ...c, score, marked_at: new Date().toISOString() }
          : c
      ));
      setPendingScores(prev => {
        const np = { ...prev };
        delete np[choiceId];
        return np;
      });
      setEditingChoice(null);
      setSuccess('Mark updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error submitting mark:', error);
      setError(error.message || 'Failed to save mark');
    }
  };

  const startEditing = (choiceId) => {
    const choice = choices.find(c => c.choice_id === choiceId);
    setPendingScores(prev => ({
      ...prev,
      [choiceId]: choice?.score?.toString() || ''
    }));
    setEditingChoice(choiceId);
  };

  const cancelEditing = () => {
    const id = editingChoice;
    setEditingChoice(null);
    setPendingScores(prev => {
      const np = { ...prev };
      delete np[id];
      return np;
    });
  };

  const handleBulkSave = async () => {
    const unsavedWithPending = choices.filter(c => !c.score && pendingScores[c.choice_id] && pendingScores[c.choice_id].trim() !== '');
    if (unsavedWithPending.length === 0) {
      setError('No pending entries to save');
      return;
    }

    setLoading(true);
    setError('');
    const promises = unsavedWithPending.map(async (choice) => {
      const scoreStr = pendingScores[choice.choice_id];
      const score = parseInt(scoreStr);
      if (isNaN(score) || score < 0 || score > 100) {
        console.warn(`Invalid score for ${choice.student_name}: ${scoreStr}`);
        return false;
      }
      try {
        const res = await fetch('/api/tutor/marks', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ choiceId: choice.choice_id, score })
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to save mark');
        }
        // Update local state
        setChoices(prev => prev.map(c => 
          c.choice_id === choice.choice_id 
            ? { ...c, score, marked_at: new Date().toISOString() }
            : c
        ));
        // Clear pending
        setPendingScores(prev => {
          const np = { ...prev };
          delete np[choice.choice_id];
          return np;
        });
        return true;
      } catch (error) {
        console.error(`Error saving mark for ${choice.student_name}:`, error);
        return false;
      }
    });

    const results = await Promise.all(promises);
    const savedCount = results.filter(Boolean).length;
    setLoading(false);
    if (savedCount > 0) {
      setSuccess(`Saved ${savedCount} marks!`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('No marks were saved due to errors');
    }
  };

  if (loading && !examsLoaded) {
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
          {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">{error}</div>}
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
          {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">{error}</div>}
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

  const pendingUnsavedCount = choices.filter(c => !c.score && pendingScores[c.choice_id] && pendingScores[c.choice_id].trim() !== '').length;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {success}
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Enter Marks</h1>
          <div>
            <Link href="/tutor/marks" className="bg-gray-500 text-white px-4 py-2 rounded mr-2">
              Select Exam
            </Link>
            <Link href="/tutor/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
              Back to Dashboard
            </Link>
            <button onClick={() => fetchChoices(examId)} disabled={loading} className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50">
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {activeExam && (
          <p className="mb-4 text-gray-600">
            Exam: <span className="font-semibold">{activeExam.name}</span> | 
            Date: {new Date(activeExam.date).toLocaleDateString()} | 
            Grade: {activeExam.grade_name} | 
            <span className="font-semibold">Total Choices: {choices.length}</span>
          </p>
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
                {choices.map((choice) => {
                  const choiceId = choice.choice_id;
                  const hasSavedScore = !!choice.score;
                  const isEditing = editingChoice === choiceId;
                  const pendingScoreStr = pendingScores[choiceId];
                  const inputValue = pendingScoreStr !== undefined ? pendingScoreStr : (hasSavedScore ? choice.score.toString() : '');
                  const isValidInput = !!inputValue && inputValue.trim() !== '' && !isNaN(parseInt(inputValue)) && parseInt(inputValue) >= 0 && parseInt(inputValue) <= 100;

                  return (
                    <tr key={choiceId} className="border-t">
                      <td className="px-4 py-2 font-medium">{choice.student_name}</td>
                      <td className="px-4 py-2">{choice.admission_number}</td>
                      <td className="px-4 py-2">{choice.subject_name}</td>
                      <td className="px-4 py-2">
                        {isEditing || !hasSavedScore ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={inputValue}
                            onChange={(e) => {
                              setPendingScores(prev => ({ ...prev, [choiceId]: e.target.value }));
                            }}
                            className="border rounded px-2 py-1 w-20"
                            autoFocus={isEditing}
                          />
                        ) : (
                          <span className="px-2 py-1 rounded bg-green-100">
                            {choice.score}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMarkSubmit(choiceId, inputValue)}
                              disabled={!isValidInput || loading}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
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
                        ) : hasSavedScore ? (
                          <button
                            onClick={() => startEditing(choiceId)}
                            disabled={loading}
                            className="px-3 py-1 rounded text-sm disabled:opacity-50 bg-yellow-500 hover:bg-yellow-600 text-white"
                          >
                            Edit
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <button
                onClick={handleBulkSave}
                disabled={loading || pendingUnsavedCount === 0}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold disabled:opacity-50"
              >
                Save All Entries ({pendingUnsavedCount} pending)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}