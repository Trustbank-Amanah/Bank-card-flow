// components/BevestigKnop.tsx
'use client';

import { useState, useTransition } from 'react';

interface BevestigKnopProps {
  label: string;
  bevestiging: string;
  actie: () => Promise<void>;
  variant?: 'primary' | 'success';
}

export function BevestigKnop({
  label,
  bevestiging,
  actie,
  variant = 'primary',
}: BevestigKnopProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const variantClasses =
    variant === 'success'
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-gray-900 hover:bg-gray-800';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-md px-4 py-2 text-sm font-medium text-white ${variantClasses}`}
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-base font-semibold text-gray-900">
              Bevestigen
            </h3>
            <p className="mt-2 text-sm text-gray-600">{bevestiging}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await actie();
                  });
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${variantClasses}`}
              >
                {pending ? 'Bezig...' : 'Bevestigen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}