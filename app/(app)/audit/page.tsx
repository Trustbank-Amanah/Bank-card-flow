// app/(app)/audit/page.tsx
import Link from 'next/link';
import { connection } from 'next/server';
import { requireRole } from '@/lib/auth';
import { haalAuditLog } from '@/lib/queries';
import { AuditTabel } from '@/components/AuditTabel';
import { FilterBalk } from '@/components/FilterBalk';
import type { AuditAction } from '@/lib/types';

export const instant = false;

interface PageProps {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

const ACTIES: { label: string; waarde: string }[] = [
  { label: 'Alle acties', waarde: '' },
  { label: 'Aangemaakt', waarde: 'CREATED' },
  { label: 'Afgehaald', waarde: 'COLLECTED' },
  { label: 'Email Alert toegevoegd', waarde: 'EMAIL_ALERT_ADDED' },
  { label: 'Geïmporteerd', waarde: 'IMPORTED' },
];

export default async function AuditPage({ searchParams }: PageProps) {
  await connection();
  await requireRole(['IT', 'ADMIN']);
  const params = await searchParams;
  const zoek = params.q ?? '';
  const filter = params.filter ?? '';

  const entries = await haalAuditLog({
    zoek,
    actie: filter ? (filter as AuditAction) : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Audit trail
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overzicht van alle acties in het systeem. Onveranderlijk en
            chronologisch.
          </p>
        </div>
        <Link
          href="/it"
          className="text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap"
        >
          ← Terug naar IT
        </Link>
      </div>

      <FilterBalk
        placeholder="Zoek klant, ID nummer, referentie, medewerker..."
        filterParam="filter"
        actieveFilter={filter}
        filters={ACTIES.map((a) => ({
          label: a.label,
          waarde: a.waarde,
        }))}
      />

      <AuditTabel entries={entries} />
    </div>
  );
}