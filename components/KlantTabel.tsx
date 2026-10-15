// components/KlantTabel.tsx
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import type { Customer } from '@/lib/types';

type Kolom =
  | 'naam'
  | 'id_nummer'
  | 'additional_reference'
  | 'tel'
  | 'email'
  | 'status'
  | 'afhaaldatum';

interface KlantTabelProps {
  klanten: Customer[];
  detailHref: (k: Customer) => string;
  toonKolommen?: Kolom[];
  legeTekst?: string;
}

export function KlantTabel({
  klanten,
  detailHref,
  toonKolommen = ['naam', 'id_nummer', 'additional_reference', 'tel', 'email', 'status'],
  legeTekst = 'Geen klanten gevonden.',
}: KlantTabelProps) {
  if (klanten.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        {legeTekst}
      </div>
    );
  }

      const show = (k: Kolom) => toonKolommen.includes(k);


  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {show('naam') && <Th>Naam</Th>}
            {show('id_nummer') && <Th>ID nummer</Th>}
            {show('additional_reference') && <Th>Additional reference</Th>}
            {show('tel') && <Th>Tel#</Th>}
            {show('email') && <Th>E-mail</Th>}
            {show('afhaaldatum') && <Th>Afhaaldatum</Th>}
            {show('status') && <Th>Status</Th>}
            <Th className="text-right">Actie</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {klanten.map((k) => (
            <tr key={k.id} className="hover:bg-gray-50">
              {show('naam') && (
                <Td>
                  <div className="font-medium text-gray-900">{k.naam}</div>
                  {k.voornaam && (
                    <div className="text-xs text-gray-500">{k.voornaam}</div>
                  )}
                </Td>
              )}
              {show('id_nummer') && <Td>{k.id_nummer}</Td>}
              {show('additional_reference') && (
                <Td>{k.additional_reference}</Td>
              )}
              {show('tel') && <Td>{k.tel ?? '—'}</Td>}
              {show('email') && <Td>{k.email_adres ?? '—'}</Td>}
              {show('afhaaldatum') && (
                <Td>
                  {k.collected_at
                    ? new Date(k.collected_at).toLocaleDateString('nl-NL')
                    : '—'}
                </Td>
              )}
              {show('status') && (
                <Td>
                  <StatusBadge status={k.workflow_status} />
                </Td>
              )}
              <Td className="text-right">
                <Link
                  href={detailHref(k)}
                  className="text-sm font-medium text-gray-900 hover:underline"
                >
                  Bekijken
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 ${className}`}>
      {children}
    </td>
  );
}