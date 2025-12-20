// app/login/LoginForm.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({ fullName: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setCheckingSession(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', { 
          headers: getAuthHeaders() 
        });
        if (res.ok) {
          const data = await res.json();
          const role = data.user.role;
          if (role === 'admin') window.location.href = '/admin/dashboard';
          else if (role === 'tutor') window.location.href = '/tutor/dashboard';
          else window.location.href = '/student/dashboard';
          return;
        }
      } catch (err) {
        // Ignore errors, proceed to login
      }
      localStorage.removeItem('auth_token');
      setCheckingSession(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

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

      const data = await res.json();
      localStorage.setItem('auth_token', data.token);

      // Redirect based on role
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-gray-700 dark:text-gray-300">Checking login status...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="Logo" width={120} height={120} />
        </div>

        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600 dark:text-blue-400">Login</h1>

        {searchParams.get('registered') && (
          <div className="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
            Registration successful! Please login.
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">සම්පූර්ණ නම</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-600 dark:text-gray-400"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <Link
              href="/"
              className="w-1/2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-semibold text-center hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </Link>
          </div>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginFormWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}