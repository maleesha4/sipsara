// src/app/tutor/papers/PapersClient.js
'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default function PapersClient() {
  const [user, setUser] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    fetchPapers();
  }, []);

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data.user);
  };

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tutor/papers');
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const res = await fetch('/api/tutor/papers', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        fetchPapers();
        e.target.reset();
      }
    } catch (error) {
      console.error('Error uploading paper:', error);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Upload Papers</h1>
          <Link href="/tutor/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded">
            Back to Dashboard
          </Link>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Upload New Paper</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input type="text" name="title" placeholder="Paper Title" required className="w-full border rounded p-2" />
            <input type="file" name="file" accept=".pdf" required className="w-full border rounded p-2" />
            <textarea name="description" placeholder="Description" rows={3} className="w-full border rounded p-2" />
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
              Upload
            </button>
          </form>
        </div>

        {/* Uploaded Papers List */}
        <div className="bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold p-6 border-b">Uploaded Papers</h2>
          {papers.length === 0 ? (
            <p className="p-6 text-gray-500">No papers uploaded yet.</p>
          ) : (
            <div className="divide-y">
              {papers.map((paper) => (
                <div key={paper.id} className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{paper.title}</h3>
                    <p className="text-sm text-gray-600">{paper.description}</p>
                    <p className="text-sm text-gray-500">Uploaded: {new Date(paper.created_at).toLocaleDateString()}</p>
                  </div>
                  <a href={paper.file_path} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}