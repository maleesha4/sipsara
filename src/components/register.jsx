'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const router = useRouter();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'student',
    dateOfBirth: '',
    address: '',
    parentName: '',
    gender: '',
    grade: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">

      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">

        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="Institute Logo" width={120} height={120} />
        </div>

        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">Register</h1>

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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email ලිපිනය</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">දුරකතන අංකය</label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          {/* Password with eye toggle */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />

              {/* Eye icon */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-600"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {/* Confirm Password with eye toggle */}
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />

              {/* Eye icon */}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2 text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium mb-1">උපන් දිනය</label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
            />
          </div> 

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-1">ස්ත්‍රී පුරුෂ භාවය</label>
            <select
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="" disabled>Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-medium mb-1">ඉගෙනුම ලබන ශ්‍රේණිය</label>
            <select
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            >
              <option value="" disabled>Select grade</option>
              <option value="6">Grade 6</option>
              <option value="7">Grade 7</option>
              <option value="8">Grade 8</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1">ලිපිනය</label>
            <textarea
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          {/* Parent Name */}
          <div>
            <label className="block text-sm font-medium mb-1">මව/පියා/භාරකරුගේ නම</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.parentName}
              onChange={(e) =>
                setFormData({ ...formData, parentName: e.target.value })
              }
            />
          </div>
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Registering...' : 'Register'}
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
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>

      </div>
    </div>
  );
}