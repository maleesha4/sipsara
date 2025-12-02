'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TutorAssignmentModal from '../../../../components/TutorAssignmentModal'; // Adjust path as needed

export default function ManageAdminExam() {
  const params = useParams();
  const examId = params.id;
  const [exam, setExam] = useState(null);
  const [currentSubjects, setCurrentSubjects] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch exam
        const examRes = await fetch(`/api/admin/exams/${examId}`);
        if (!examRes.ok) throw new Error('Failed to fetch exam');
        const examData = await examRes.json();
        setExam(examData.exam);

        // Fetch current subjects for this exam
        const currentSubjectsRes = await fetch(`/api/admin/exams/${examId}/subjects`);
        if (currentSubjectsRes.ok) {
          const currentSubjectsData = await currentSubjectsRes.json();
          setCurrentSubjects(currentSubjectsData.subjects);
        }

        // Fetch all tutors
        const allTutorsRes = await fetch('/api/admin/tutors');
        if (allTutorsRes.ok) {
          const allTutorsData = await allTutorsRes.json();
          setAllTutors(allTutorsData.tutors);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div>
      <h1>Manage Exam: {exam?.name}</h1>
      <button onClick={handleOpenModal}>Assign Tutors</button>
      {showModal && (
        <TutorAssignmentModal
          subjects={currentSubjects}
          tutors={allTutors}
          onClose={handleCloseModal}
        />
      )}
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}