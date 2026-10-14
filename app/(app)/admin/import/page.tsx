// app/(app)/admin/import/page.tsx
import Link from 'next/link';
import { connection } from 'next/server';
import { requireRole } from '@/lib/auth';
import { ImportForm } from '@/components/ImportForm';

export const instant = false;

export default async function ImportPage() {
  await connection();
  await requireRole(['ADMIN']);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Excel / CSV import
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Importeer bestaande klanten uit het Excel-bestand. Duplicaten
            worden overgeslagen.
          </p>
        </div>
        <Link
          href="/it"
          className="text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap"
        >
          ← Terug naar IT
        </Link>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Belangrijk</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>
            Sla het Excel-bestand op als <strong>CSV (UTF-8, kommagescheiden)</strong>.
          </li>
          <li>
            Voeg een kolom <strong>Email Alert Added</strong> toe met
            waarden <code>Ja</code> of <code>Nee</code> om aan te geven
            welke klanten al in iMAL zaten.
          </li>
          <li>
            Bestaande klanten (zelfde ID nummer + additional reference)
            worden overgeslagen, niet overschreven.
          </li>
          <li>
            De drie verplichte kolommen zijn: <strong>Naam</strong>,{' '}
            <strong>ID nummer</strong>, <strong>Additional reference</strong>.
          </li>
        </ul>
      </div>

      <ImportForm />

      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
        <h2 className="text-sm font-semibold text-gray-900">
          Wat gebeurt er bij import?
        </h2>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>
            <strong>Niet afgehaald</strong> → status <em>Nog af te halen</em>
          </li>
          <li>
            <strong>Afgehaald</strong>, geen Email Alert → status{' '}
            <em>Email Alert te verwerken</em> (IT ziet deze klant)
          </li>
          <li>
            <strong>Afgehaald + Email Alert Added = Ja</strong> → status{' '}
            <em>Afgerond</em> (IT ziet deze klant niet)
          </li>
        </ul>
      </div>
    </div>
  );
}