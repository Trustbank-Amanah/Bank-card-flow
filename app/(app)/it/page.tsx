// app/(app)/it/page.tsx
import Link from 'next/link';
import { connection } from 'next/server';
import { requireRole } from '@/lib/auth';
import { haalKlanten, haalDashboardStats } from '@/lib/queries';
import { KlantTabel } from '@/components/KlantTabel';
import { KpiKaart } from '@/components/KpiKaart';
import { FilterBalk } from '@/components/FilterBalk';

export const instant = false;

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ItDashboard({ searchParams }: PageProps) {
  await connection();
  await requireRole(['IT', 'ADMIN']);
  const params = await searchParams;
  const zoek = params.q ?? '';

  const [stats, klanten] = await Promise.all([
    haalDashboardStats(),
    haalKlanten({ zoek, workflow_status: 'EMAIL_ALERT_PENDING' }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Email Alerts — te verwerken
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Klanten die hun pinpas hebben afgehaald maar nog niet zijn toegevoegd
          aan het Email Alerts Portal.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KpiKaart label="Totaal klanten" waarde={stats.totaal} />
        <KpiKaart label="Nog af te halen" waarde={stats.nogAfTeHalen} />
        <KpiKaart label="Afgehaald" waarde={stats.afgehaald} />
        <KpiKaart
          label="Email Alerts te verwerken"
          waarde={stats.emailAlertPending}
          variant="warning"
        />
        <KpiKaart
          label="Email Alerts toegevoegd"
          waarde={stats.emailAlertAdded}
          variant="success"
        />
      </div>

      {/* Filterbalk + link naar afgerond */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBalk
          placeholder="Zoek naam, voornaam, ID nummer, referentie, tel..."
        />
        <Link
          href="/it/afgerond"
          className="text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap"
        >
          Bekijk afgeronde klanten →
        </Link>
      </div>

      {/* Tabel */}
      {klanten.length === 0 ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-sm font-medium text-green-800">
            {zoek
              ? 'Geen klanten gevonden met deze zoekopdracht.'
              : 'Alle klanten zijn verwerkt. Er zijn geen openstaande Email Alerts.'}
          </p>
        </div>
      ) : (
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
        />
      )}
    </div>
  );
}