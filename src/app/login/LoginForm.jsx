// app/login/LoginForm.jsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ safely inside client component

  const [formData, setFormData] = useState({ fullName: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    if (token) window.location.href = '/student/dashboard'; // Full nav for consistency
    else setCheckingSession(false);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Safe parse: Check if ok first, then text for debug if needed
      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${res.status}: ${errorText.substring(0, 100)}` };
        }
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await res.json(); // Now safe—response is JSON

      // Client-side full navigation (sends cookie)
      if (data.user.role === 'admin') window.location.href = '/admin/dashboard';
      else if (data.user.role === 'tutor') window.location.href = '/tutor/dashboard';
      else window.location.href = '/student/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p>Checking login status...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="Logo" width={120} height={120} />
        </div>

        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">Login</h1>

        {searchParams.get('registered') && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Registration successful! Please login.
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">සම්පූර්ණ නම</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-600"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <Link
              href="/"
              className="w-1/2 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold text-center hover:bg-gray-400"
            >
              Cancel
            </Link>
          </div>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginFormWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}