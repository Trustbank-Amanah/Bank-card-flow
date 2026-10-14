// lib/auth.ts
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile, Role } from '@/lib/types';

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  if (!data.is_active) return null;

  return data as Profile;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  return profile;
}

export async function requireRole(allowed: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) {
    redirect(dashboardForRole(profile.role));
  }
  return profile;
}

export function dashboardForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/import';
    case 'IT':
      return '/it';
    case 'FRONT_OFFICER':
      return '/front-office';
  }
}