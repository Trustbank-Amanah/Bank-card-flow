// app/(app)/front-office/klanten/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { haalKlant } from '@/lib/queries';
import { StatusBadge } from '@/components/StatusBadge';
import { BevestigKnop } from '@/components/BevestigKnop';
import { markeerAfgehaaldAction } from './actions';

export const instant = false;


interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function KlantDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requireRole(['FRONT_OFFICER', 'ADMIN']);
  const { id } = await params;
  const { success } = await searchParams;
  const klant = await haalKlant(id);

  if (!klant) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/front-office"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Terug naar dashboard
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

      {success === 'afgehaald' && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Kaart gemarkeerd als afgehaald. IT ziet deze klant nu in het Email Alerts dashboard.
        </div>
      )}

      {/* Actieblok */}
        {klant.workflow_status === 'PENDING' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-semibold text-amber-900">
              Actie vereist
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              Markeer deze klant als afgehaald zodra de pinpas is overhandigd.
            </p>
            <div className="mt-4">
              <BevestigKnop
                label="Markeer als afgehaald"
                bevestiging={`Weet je zeker dat ${klant.naam} de pinpas heeft afgehaald? Deze actie kan niet ongedaan worden gemaakt.`}
                actie={markeerAfgehaaldAction.bind(null, klant.id)}
                variant="primary"
              />
            </div>
          </div>
        )}

      {klant.workflow_status === 'EMAIL_ALERT_ADDED' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <h2 className="text-sm font-semibold text-green-900">
            Afgerond
          </h2>
          <p className="mt-1 text-sm text-green-800">
            Deze klant is volledig verwerkt.
          </p>
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
          <Rij label="Additional reference" waarde={klant.additional_reference} />
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
          <h2 className="text-sm font-semibold text-gray-900">Historie</h2>
        </div>
        <dl className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0">
          <Rij
            label="Aangemaakt op"
            waarde={new Date(klant.created_at).toLocaleString('nl-NL')}
          />
          <Rij
            label="Afgehaald op"
            waarde={
              klant.collected_at
                ? new Date(klant.collected_at).toLocaleString('nl-NL')
                : null
            }
          />
          <Rij
            label="Email Alert toegevoegd op"
            waarde={
              klant.email_alert_added_at
                ? new Date(klant.email_alert_added_at).toLocaleString('nl-NL')
                : null
            }
          />
          <Rij
            label="Laatst gewijzigd"
            waarde={new Date(klant.updated_at).toLocaleString('nl-NL')}
          />
        </dl>
      </div>
    </div>
  );
}

function Rij({
  label,
  waarde,
  fullWidth,
}: {
  label: string;
  waarde: string | null | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`px-6 py-4 ${fullWidth ? 'sm:col-span-2' : ''}`}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">
        {waarde && waarde !== '' ? waarde : '—'}
      </dd>
    </div>
  );
}