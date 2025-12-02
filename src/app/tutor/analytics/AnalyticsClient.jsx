// src/app/tutor/analytics/AnalyticsClient.js
'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default function AnalyticsClient() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState({ averages: {}, topStudents: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    fetchAnalytics();
  }, []);

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data.user);
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tutor/analytics');
      const data = await res.json();
      setAnalytics(data.analytics || {});
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <Link href="/tutor/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded">
            Back to Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Average Scores per Grade */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Average Scores by Grade</h2>
            <ul className="space-y-2">
              {Object.entries(analytics.averages || {}).map(([grade, avg]) => (
                <li key={grade} className="flex justify-between">
                  <span>Grade {grade}</span>
                  <span>{avg.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Students */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Top Students</h2>
            <ul className="space-y-2">
              {analytics.topStudents.map((student) => (
                <li key={student.id} className="flex justify-between">
                  <span>{student.name}</span>
                  <span>{student.avgScore.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}