// components/AuditTabel.tsx
import Link from 'next/link';
import type { AuditEntryMetProfiel } from '@/lib/queries';
import type { AuditAction } from '@/lib/types';

const ACTIE_LABELS: Record<AuditAction, { label: string; className: string }> = {
  CREATED: {
    label: 'Aangemaakt',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  UPDATED: {
    label: 'Gewijzigd',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  COLLECTED: {
    label: 'Afgehaald',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  EMAIL_ALERT_ADDED: {
    label: 'Email Alert toegevoegd',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  IMPORTED: {
    label: 'Geïmporteerd',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

interface AuditTabelProps {
  entries: AuditEntryMetProfiel[];
  detailHref?: (e: AuditEntryMetProfiel) => string;
}

export function AuditTabel({ entries, detailHref }: AuditTabelProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Geen audit entries gevonden.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <Th>Datum/tijd</Th>
            <Th>Actie</Th>
            <Th>Klant</Th>
            <Th>Uitgevoerd door</Th>
            <Th>Notities</Th>
            {detailHref && <Th className="text-right">Klant</Th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {entries.map((e) => {
            const actie = ACTIE_LABELS[e.action];
            return (
              <tr key={e.id} className="hover:bg-gray-50">
                <Td>
                  {new Date(e.performed_at).toLocaleString('nl-NL')}
                </Td>
                <Td>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${actie.className}`}
                  >
                    {actie.label}
                  </span>
                </Td>
                <Td>
                  {e.klant_naam ? (
                    <div>
                      <div className="font-medium text-gray-900">
                        {e.klant_naam}
                      </div>
                      <div className="text-xs text-gray-500">
                        {e.klant_id_nummer} · {e.klant_reference}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </Td>
                <Td>
                  {e.performer_naam ?? e.performer_email ?? (
                    <span className="text-gray-400">Systeem</span>
                  )}
                </Td>
                <Td>
                  {e.notes ?? <span className="text-gray-400">—</span>}
                </Td>
                {detailHref && (
                  <Td className="text-right">
                    <Link
                      href={detailHref(e)}
                      className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      Bekijken
                    </Link>
                  </Td>
                )}
              </tr>
            );
          })}
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