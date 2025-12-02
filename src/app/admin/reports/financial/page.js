// ============================================
// FILE: src/app/admin/reports/financial/page.js
// ============================================
'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function FinancialReport() {
  const [user, setUser] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [examBreakdown, setExamBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);

      const financialRes = await fetch('/api/admin/reports/financial');
      const financialData = await financialRes.json();
      setFinancial(financialData.summary);
      setExamBreakdown(financialData.examBreakdown || []);
    } catch (error) {
      console.error('Error:', error);
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

  if (!financial) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-red-600">No financial data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">💰 Financial Report</h1>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-green-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-semibold mb-2">Total Revenue</h3>
            <p className="text-4xl font-bold">Rs. {parseFloat(financial.total_revenue).toLocaleString()}</p>
          </div>
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-semibold mb-2">Collected</h3>
            <p className="text-4xl font-bold">Rs. {parseFloat(financial.collected).toLocaleString()}</p>
            <p className="text-sm mt-1">{financial.collection_rate}% rate</p>
          </div>
          <div className="bg-yellow-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-semibold mb-2">Pending</h3>
            <p className="text-4xl font-bold">Rs. {parseFloat(financial.pending).toLocaleString()}</p>
            <p className="text-sm mt-1">{financial.pending_count} payments</p>
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-semibold mb-2">Avg Fee/Exam</h3>
            <p className="text-4xl font-bold">Rs. {parseFloat(financial.avg_fee).toLocaleString()}</p>
          </div>
        </div>

        {/* Payment Status Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Paid Registrations
            </h3>
            <p className="text-4xl font-bold text-green-600">{financial.paid_count}</p>
            <p className="text-sm text-gray-600 mt-2">
              {financial.total_registrations > 0 
                ? ((financial.paid_count / financial.total_registrations) * 100).toFixed(1) 
                : 0}% of total
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              Pending Payments
            </h3>
            <p className="text-4xl font-bold text-yellow-600">{financial.pending_count}</p>
            <p className="text-sm text-gray-600 mt-2">
              {financial.total_registrations > 0
                ? ((financial.pending_count / financial.total_registrations) * 100).toFixed(1)
                : 0}% of total
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
              Refunded
            </h3>
            <p className="text-4xl font-bold text-gray-600">{financial.refunded_count}</p>
            <p className="text-sm text-gray-600 mt-2">
              Rs. {parseFloat(financial.refunded_amount).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Exam-wise Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Exam-wise Revenue Breakdown</h2>
          </div>
          
          <div className="p-6">
            {examBreakdown.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No exam data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Exam Name</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-center">Fee</th>
                      <th className="px-4 py-3 text-center">Registrations</th>
                      <th className="px-4 py-3 text-center">Paid</th>
                      <th className="px-4 py-3 text-center">Pending</th>
                      <th className="px-4 py-3 text-right">Total Revenue</th>
                      <th className="px-4 py-3 text-right">Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examBreakdown.map((exam, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{exam.exam_name}</td>
                        <td className="px-4 py-3 text-center text-sm">
                          {new Date(exam.exam_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">Rs. {parseFloat(exam.exam_fee).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">{exam.total_registrations}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                            {exam.paid_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-semibold">
                            {exam.pending_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          Rs. {parseFloat(exam.potential_revenue).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">
                          Rs. {parseFloat(exam.collected_revenue).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td colSpan="3" className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-center">{financial.total_registrations}</td>
                      <td className="px-4 py-3 text-center">{financial.paid_count}</td>
                      <td className="px-4 py-3 text-center">{financial.pending_count}</td>
                      <td className="px-4 py-3 text-right text-lg">
                        Rs. {parseFloat(financial.total_revenue).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-lg text-green-600">
                        Rs. {parseFloat(financial.collected).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Collection Rate Indicator */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-bold mb-4">Overall Collection Rate</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ width: `${financial.collection_rate}%` }}
                >
                  {financial.collection_rate}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{financial.collection_rate}%</p>
              <p className="text-sm text-gray-600">collected</p>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <button
          onClick={() => window.print()}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Print Financial Report
        </button>
      </div>
    </div>
  );
}