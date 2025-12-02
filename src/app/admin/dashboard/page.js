// ============================================
// FILE: src/app/admin/dashboard/page.js
// ============================================
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '../../../lib/auth'; // Adjust path if needed (e.g., relative to admin folder)
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return redirect('/login');
  }

  try {
    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return redirect('/login');
    }
  } catch (err) {
    return redirect('/login');
  }

  return <AdminDashboardClient />;
}