// components/ImportForm.tsx
'use client';

import { useActionState } from 'react';
import {
  importeerBestandAction,
  type ImportResultaat,
} from '@/app/(app)/admin/import/actions';

const initialState: ImportResultaat | null = null;

export function ImportForm() {
  const [state, formAction, pending] = useActionState(
    importeerBestandAction,
    initialState
  );

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-sm font-semibold text-gray-900">
          Excel- of CSV-bestand uploaden
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Het bestand moet de kolommen bevatten die ook in Excel staan. De
          volgende kolommen worden herkend (hoofdletterongevoelig):
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 sm:grid-cols-3">
          <li>Naam</li>
          <li>Voornaam</li>
          <li>ID nummer</li>
          <li>Additional reference</li>
          <li>Tel#</li>
          <li>Email adres</li>
          <li>Status</li>
          <li>Opmerking 2</li>
          <li>Pinpas aangeleverd</li>
          <li>Contact gemkt klant</li>
          <li>Afgehaald</li>
          <li>Email Alert Added</li>
        </ul>

        <div className="mt-4">
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            required
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
          />
          <p className="mt-2 text-xs text-gray-500">
            Ondersteund: .xlsx, .xls, .csv (UTF-8)
          </p>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? 'Bezig met importeren...' : 'Importeren'}
          </button>
        </div>
      </form>

      {state && (
        <div
          className={`rounded-lg border p-6 ${
            state.ok
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <h2
            className={`text-sm font-semibold ${
              state.ok ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {state.ok ? 'Import voltooid' : 'Import mislukt'}
          </h2>

          {state.algemeneFout && (
            <p className="mt-2 text-sm text-red-700">
              {state.algemeneFout}
            </p>
          )}

          {state.ok && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                  Geïmporteerd
                </p>
                <p className="mt-1 text-2xl font-semibold text-green-900">
                  {state.imported}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                  Overgeslagen
                </p>
                <p className="mt-1 text-2xl font-semibold text-green-900">
                  {state.skipped}
                </p>
              </div>
            </div>
          )}

          {state.errors.length > 0 && (
            <details className="mt-4" open={!state.ok}>
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Details ({state.errors.length})
              </summary>
              <ul className="mt-2 max-h-64 overflow-y-auto text-xs text-gray-700">
                {state.errors.map((e, i) => (
                  <li key={i} className="border-b border-gray-200 py-1">
                    {e.rij > 0 && (
                      <span className="font-medium">Rij {e.rij}: </span>
                    )}
                    {e.id_nummer && (
                      <span className="text-gray-500">
                        [{e.id_nummer}]{' '}
                      </span>
                    )}
                    {e.reden}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}