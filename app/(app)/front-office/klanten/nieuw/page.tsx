// app/(app)/front-office/klanten/nieuw/page.tsx
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { KlantForm } from '@/components/KlantForm';
import { maakKlantAction } from './actions';

export const instant = false;


export default async function NieuweKlantPage() {
  await requireRole(['FRONT_OFFICER', 'ADMIN']);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/front-office"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Terug naar dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          Nieuwe klant
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Registreer een klant die een pinpas komt ophalen.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <KlantForm action={maakKlantAction} submitLabel="Klant opslaan" />
      </div>
    </div>
  );
}