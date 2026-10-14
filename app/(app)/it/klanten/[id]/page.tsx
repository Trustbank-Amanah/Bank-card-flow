// app/(app)/it/klanten/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { haalKlant } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/StatusBadge';
import { BevestigKnop } from '@/components/BevestigKnop';
import { markeerEmailAlertToegevoegdAction } from './actions';
import type { Profile } from '@/lib/types';

export const instant = false;


interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function ItKlantDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requireRole(['IT', 'ADMIN']);
  const { id } = await params;
  const { success } = await searchParams;
  const klant = await haalKlant(id);

  if (!klant) notFound();

  // Namen van uitvoerders ophalen (indien aanwezig)
  const supabase = await createClient();
  const userIds = [
    klant.created_by,
    klant.collected_by,
    klant.email_alert_added_by,
  ].filter((x): x is string => Boolean(x));

  const { data: profielen } = userIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)
    : { data: [] as Pick<Profile, 'id' | 'full_name' | 'email'>[] };

  const naamVan = (userId: string | null) => {
    if (!userId) return null;
    const p = profielen?.find((x) => x.id === userId);
    return p?.full_name ?? p?.email ?? null;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/it"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Terug naar Email Alerts
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {klant.naam}
              {klant.voornaam && (
                <span className="ml-2 text-base font-normal text-gray-500">
                  {klant.voornaam}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ID nummer: {klant.id_nummer} · Ref: {klant.additional_reference}
            </p>
          </div>
          <StatusBadge status={klant.workflow_status} />
        </div>
      </div>

      {success === 'toegevoegd' && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Klant gemarkeerd als toegevoegd aan Email Alerts Portal.
        </div>
      )}

      {/* Actieblok: alleen als EMAIL_ALERT_PENDING */}
      {klant.workflow_status === 'EMAIL_ALERT_PENDING' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900">
            Actie vereist
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            Voeg deze klant handmatig toe aan het Email Alerts Portal (iMAL) en
            markeer daarna de actie als voltooid.
          </p>
          <div className="mt-4">
            <BevestigKnop
              label="Markeer Email Alert als toegevoegd"
              bevestiging={`Weet je zeker dat ${klant.naam} is toegevoegd aan het Email Alerts Portal? Deze actie kan niet ongedaan worden gemaakt.`}
              actie={markeerEmailAlertToegevoegdAction.bind(null, klant.id)}
              variant="success"
            />
          </div>
        </div>
      )}

      {/* Klantgegevens */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Klantgegevens
          </h2>
        </div>
        <dl className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0">
          <Rij label="Naam" waarde={klant.naam} />
          <Rij label="Voornaam" waarde={klant.voornaam} />
          <Rij label="ID nummer" waarde={klant.id_nummer} />
          <Rij
            label="Additional reference"
            waarde={klant.additional_reference}
          />
          <Rij label="Tel#" waarde={klant.tel} />
          <Rij label="E-mailadres" waarde={klant.email_adres} />
          <Rij label="Status" waarde={klant.status} />
          <Rij
            label="Pinpas aangeleverd"
            waarde={klant.pinpas_aangeleverd ? 'Ja' : 'Nee'}
          />
          <Rij
            label="Contact gemaakt"
            waarde={klant.contact_gemaakt_klant ? 'Ja' : 'Nee'}
          />
          <Rij
            label="Opmerking 2"
            waarde={klant.opmerking_2}
            fullWidth
          />
        </dl>
      </div>

      {/* Historie */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Historie
          </h2>
        </div>
        <dl className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0">
          <Rij
            label="Aangemaakt op"
            waarde={new Date(klant.created_at).toLocaleString('nl-NL')}
            sub={naamVan(klant.created_by)}
          />
          <Rij
            label="Afgehaald op"
            waarde={
              klant.collected_at
                ? new Date(klant.collected_at).toLocaleString('nl-NL')
                : null
            }
            sub={naamVan(klant.collected_by)}
          />
          <Rij
            label="Email Alert toegevoegd op"
            waarde={
              klant.email_alert_added_at
                ? new Date(klant.email_alert_added_at).toLocaleString('nl-NL')
                : null
            }
            sub={naamVan(klant.email_alert_added_by)}
          />
          <Rij
            label="Laatst gewijzigd"
            waarde={new Date(klant.updated_at).toLocaleString('nl-NL')}
            sub={naamVan(klant.updated_by)}
          />
        </dl>
      </div>
    </div>
  );
}

function Rij({
  label,
  waarde,
  sub,
  fullWidth,
}: {
  label: string;
  waarde: string | null | undefined;
  sub?: string | null;
  fullWidth?: boolean;
}) {
  return (
    <div className={`px-6 py-4 ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">
        {waarde && waarde !== '' ? waarde : '—'}
        {sub && (
          <span className="ml-2 text-xs text-gray-400">door {sub}</span>
        )}
      </dd>
    </div>
  );
}