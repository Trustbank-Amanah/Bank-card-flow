// app/(app)/it/afgerond/page.tsx
import Link from 'next/link';
import { connection } from 'next/server';
import { requireRole } from '@/lib/auth';
import { haalKlanten } from '@/lib/queries';
import { KlantTabel } from '@/components/KlantTabel';
import { FilterBalk } from '@/components/FilterBalk';

export const instant = false;

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AfgerondPage({ searchParams }: PageProps) {
  await connection();
  await requireRole(['IT', 'ADMIN']);
  const params = await searchParams;
  const zoek = params.q ?? '';

  const klanten = await haalKlanten({
    zoek,
    workflow_status: 'EMAIL_ALERT_ADDED',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Afgeronde klanten
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Klanten die volledig verwerkt zijn: pinpas afgehaald én toegevoegd
            aan Email Alerts.
          </p>
        </div>
        <Link
          href="/it"
          className="text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap"
        >
          ← Terug naar te verwerken
        </Link>
      </div>

      <FilterBalk placeholder="Zoek naam, voornaam, ID nummer, referentie, tel..." />

      <KlantTabel
        klanten={klanten}
        detailHref={(k) => `/it/klanten/${k.id}`}
        toonKolommen={[
          'naam',
          'id_nummer',
          'additional_reference',
          'tel',
          'email',
          'afhaaldatum',
          'status',
        ]}
        legeTekst={
          zoek
            ? 'Geen klanten gevonden met deze zoekopdracht.'
            : 'Nog geen afgeronde klanten.'
        }
      />
    </div>
  );
}