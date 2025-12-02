'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function StudentPapers({ params }) {
  const [user, setUser] = useState(null);
  const [papers, setPapers] = useState([]);
  const [examInfo, setExamInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);

      const papersRes = await fetch(`/api/student/papers/${params.registrationId}`);
      const papersData = await papersRes.json();
      setPapers(papersData.papers || []);
      setExamInfo(papersData.examInfo);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (paperId, fileName) => {
    try {
      const res = await fetch(`/api/student/papers/download/${paperId}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const getPaperTypeLabel = (type) => {
    switch (type) {
      case 'question_paper': return 'Question Paper';
      case 'marking_scheme': return 'Marking Scheme';
      case 'answer_sheet': return 'Answer Sheet';
      case 'model_answer': return 'Model Answer';
      default: return type;
    }
  };

  const getPaperTypeColor = (type) => {
    switch (type) {
      case 'question_paper': return 'bg-blue-100 text-blue-800';
      case 'marking_scheme': return 'bg-green-100 text-green-800';
      case 'answer_sheet': return 'bg-yellow-100 text-yellow-800';
      case 'model_answer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Exam Papers & Materials</h1>
        {examInfo && (
          <p className="text-gray-600 mb-6">{examInfo.exam_name}</p>
        )}

        {papers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No papers available yet</p>
            <p className="text-gray-400 text-sm mt-2">Papers will be uploaded by tutors</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(
              papers.reduce((acc, paper) => {
                if (!acc[paper.subject_name]) acc[paper.subject_name] = [];
                acc[paper.subject_name].push(paper);
                return acc;
              }, {})
            ).map(([subject, subjectPapers]) => (
              <div key={subject} className="bg-white rounded-lg shadow">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-t-lg">
                  <h2 className="text-xl font-bold">{subject}</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {subjectPapers.map(paper => (
                      <div key={paper.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{paper.paper_title}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${getPaperTypeColor(paper.paper_type)}`}>
                              {getPaperTypeLabel(paper.paper_type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Uploaded: {new Date(paper.uploaded_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Size: {(paper.file_size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownload(paper.id, paper.paper_title)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
