'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function AdmissionCard({ params }) {
  const [user, setUser] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);

      const cardRes = await fetch(`/api/student/admission-card/${params.registrationId}`);
      const cardInfo = await cardRes.json();
      setCardData(cardInfo);

      // Mark as downloaded
      await fetch(`/api/student/admission-card/${params.registrationId}/downloaded`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  if (!cardData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-500 text-lg">Admission card not available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="no-print">
        <Navbar user={user} />
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="no-print mb-4 flex justify-between">
          <h1 className="text-2xl font-bold">Admission Card</h1>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Print Card
          </button>
        </div>

        <div className="bg-white border-4 border-blue-600 p-8">
          {/* Header */}
          <div className="text-center mb-6 border-b-2 pb-4">
            <h1 className="text-3xl font-bold text-blue-600">SIPSARA INSTITUTE</h1>
            <h2 className="text-xl font-semibold mt-2">ADMISSION CARD</h2>
            <p className="text-lg mt-1">{cardData.exam.exam_name}</p>
          </div>

          {/* Student Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="font-semibold text-lg">{cardData.student.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Index Number</p>
                <p className="font-semibold text-lg">{cardData.student.index_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Admission Card Number</p>
                <p className="font-mono font-bold text-lg text-blue-600">
                  {cardData.registration.admission_card_number}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Exam Date</p>
                <p className="font-semibold text-lg">
                  {new Date(cardData.exam.exam_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Exam Type</p>
                <p className="font-semibold capitalize">{cardData.exam.exam_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Date</p>
                <p className="font-semibold">
                  {new Date(cardData.registration.registration_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Exam Schedule */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 border-b pb-2">Exam Schedule</h3>
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Subject</th>
                  <th className="border px-3 py-2">Date</th>
                  <th className="border px-3 py-2">Time</th>
                  <th className="border px-3 py-2">Venue</th>
                </tr>
              </thead>
              <tbody>
                {cardData.schedule.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border px-3 py-2">{item.subject_name}</td>
                    <td className="border px-3 py-2 text-center">
                      {new Date(item.exam_date).toLocaleDateString()}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      {item.start_time} - {item.end_time}
                    </td>
                    <td className="border px-3 py-2 text-center">{item.venue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded">
            <h3 className="font-bold mb-2">Important Instructions:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Bring this admission card to the examination hall</li>
              <li>Arrive at least 30 minutes before the exam</li>
              <li>Bring your own stationery (pens, pencils, eraser, etc.)</li>
              <li>Mobile phones are strictly prohibited in the exam hall</li>
              <li>Follow all instructions given by the invigilators</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Principal's Signature</p>
              <div className="mt-2 border-t-2 border-gray-400 w-40"></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
              <p className="text-xs text-gray-500">Sipsara Institute</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

