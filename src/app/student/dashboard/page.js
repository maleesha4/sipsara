import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '../../../lib/auth';
import DashboardClient from './DashboardClient';

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return redirect('/login');
  }

  try {
    await verifyToken(token);
  } catch (err) {
    return redirect('/login');
  }

  return <DashboardClient />;
}