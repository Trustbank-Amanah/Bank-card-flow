// app/(app)/layout.tsx
import Link from 'next/link';
import { connection} from 'next/server';
import { requireProfile } from '@/lib/auth';
import { logout } from '../(auth)/login/actions';
import type { Role } from '@/lib/types';

export const instant = false;


const NAV: Record<Role, { href: string; label: string }[]> = {
  FRONT_OFFICER: [
    { href: '/front-office', label: 'Dashboard' },
    { href: '/front-office/customers/new', label: 'Nieuwe klant' },
  ],
  IT: [
    { href: '/it', label: 'Email Alerts' },
    { href: '/it/afgerond', label: 'Afgerond' },
    { href: '/audit', label: 'Audit' },
  ],
  ADMIN: [
    { href: '/front-office', label: 'Front Office' },
    { href: '/it', label: 'IT' },
    { href: '/audit', label: 'Audit' },
    { href: '/admin/import', label: 'Import' },
  ],
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const profile = await requireProfile();
  const nav = NAV[profile.role];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-sm font-semibold text-gray-900"
              >
                Bank Card Workflow
              </Link>
              <nav className="flex items-center gap-6">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {profile.full_name}
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                  {profile.role}
                </span>
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Uitloggen
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}