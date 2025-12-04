// app/login/LoginForm.jsx
'use client';
import { useState, Suspense } from 'react';
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

  // REMOVED: Session checking that was causing the loop
  // Let middleware handle redirects for authenticated users

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('[LOGIN FORM] Submitting login');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IMPORTANT: Include cookies
        body: JSON.stringify(formData),
      });

      console.log('[LOGIN FORM] Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[LOGIN FORM] Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${res.status}: ${errorText.substring(0, 100)}` };
        }
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await res.json();
      console.log('[LOGIN FORM] Login successful, role:', data.user.role);

      // Wait a moment for cookie to be set, then redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use router.push for client-side navigation
      const dashboardPath = `/${data.user.role}/dashboard`;
      console.log('[LOGIN FORM] Redirecting to:', dashboardPath);
      router.push(dashboardPath);
      
    } catch (err) {
      console.error('[LOGIN FORM] Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

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

        {searchParams.get('error') === 'unauthorized' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Please login to continue.
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
              disabled={loading}
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
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <Link
              href="/"
              className={`w-1/2 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold text-center hover:bg-gray-400 ${loading ? 'pointer-events-none opacity-50' : ''}`}
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}