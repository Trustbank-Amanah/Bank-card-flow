// app/(app)/front-office/page.tsx
import Link from 'next/link';
import { connection } from 'next/server';
import { requireRole } from '@/lib/auth';
import { haalKlanten, haalDashboardStats } from '@/lib/queries';
import { KlantTabel } from '@/components/KlantTabel';
import { KpiKaart } from '@/components/KpiKaart';
import { FilterBalk } from '@/components/FilterBalk';

export const instant = false;

interface PageProps {
  searchParams: Promise<{ q?: string; tab?: string }>;
}

export default async function FrontOfficeDashboard({ searchParams }: PageProps) {
  await connection();
  await requireRole(['FRONT_OFFICER', 'ADMIN']);
  const params = await searchParams;
  const zoek = params.q ?? '';
  const tab = params.tab ?? 'te-verwerken';

  const [stats, klanten] = await Promise.all([
    haalDashboardStats(),
    haalKlanten({
      zoek,
      workflow_status: tab === 'afgehaald' ? undefined : 'PENDING',
    }),
  ]);

  const afgehaaldKlanten =
    tab === 'afgehaald'
      ? await haalKlanten({ zoek }).then((all) =>
          all.filter((k) => k.workflow_status !== 'PENDING')
        )
      : [];

  const teTonen = tab === 'afgehaald' ? afgehaaldKlanten : klanten;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Front Office
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registreer klanten en markeer kaarten als afgehaald.
          </p>
        </div>
        <Link
          href="/front-office/klanten/nieuw"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Nieuwe klant
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiKaart label="Totaal klanten" waarde={stats.totaal} />
        <KpiKaart
          label="Nog af te halen"
          waarde={stats.nogAfTeHalen}
          variant="warning"
        />
        <KpiKaart label="Afgehaald" waarde={stats.afgehaald} />
        <KpiKaart
          label="Afgerond"
          waarde={stats.emailAlertAdded}
          variant="success"
        />
      </div>

      {/*
        Let op: FilterBalk gebruikt standaard 'filter' als param naam.
        Voor FO gebruiken we 'tab' — dus we geven filterParam="tab" mee.
      */}
      <FilterBalk
        placeholder="Zoek naam, ID nummer, referentie, tel..."
        filterParam="tab"
        actieveFilter={tab}
        filters={[
          {
            label: 'Nog af te halen',
            waarde: 'te-verwerken',
            aantal: stats.nogAfTeHalen,
          },
          {
            label: 'Afgehaald',
            waarde: 'afgehaald',
            aantal: stats.afgehaald,
          },
        ]}
      />

      <KlantTabel
        klanten={teTonen}
        detailHref={(k) => `/front-office/klanten/${k.id}`}
        toonKolommen={[
          'naam',
          'id_nummer',
          'additional_reference',
          'tel',
          'email',
          'status',
        ]}
        legeTekst={
          tab === 'afgehaald'
            ? 'Nog geen afgehaalde kaarten.'
            : 'Geen klanten die nog afgehaald moeten worden.'
        }
      />
    </div>
  );
}