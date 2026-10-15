// app/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentProfile, dashboardForRole } from '@/lib/auth';

export const instant = false;

export default async function Home() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  redirect(dashboardForRole(profile.role));
}