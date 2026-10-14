// components/KlantForm.tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import type { KlantInput } from '@/lib/schemas';

export interface KlantFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof KlantInput, string>>;
  values?: Partial<Record<keyof KlantInput, string | boolean>>;
}

interface KlantFormProps {
  action: (
    state: KlantFormState,
    formData: FormData
  ) => Promise<KlantFormState>;
  initialValues?: Partial<Record<keyof KlantInput, string | boolean>>;
  submitLabel?: string;
}

const initialState: KlantFormState = {};

export function KlantForm({
  action,
  initialValues = {},
  submitLabel = 'Klant opslaan',
}: KlantFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const v = state.values ?? initialValues;

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Sectie titel="Verplichte gegevens">
        <Veld
          label="Naam"
          name="naam"
          required
          defaultValue={String(v.naam ?? '')}
          error={state.fieldErrors?.naam}
        />
        <Veld
          label="ID nummer"
          name="id_nummer"
          required
          defaultValue={String(v.id_nummer ?? '')}
          error={state.fieldErrors?.id_nummer}
        />
        <Veld
          label="Additional reference"
          name="additional_reference"
          required
          defaultValue={String(v.additional_reference ?? '')}
          error={state.fieldErrors?.additional_reference}
        />
      </Sectie>

      <Sectie titel="Optionele gegevens">
        <Veld
          label="Voornaam"
          name="voornaam"
          defaultValue={String(v.voornaam ?? '')}
          error={state.fieldErrors?.voornaam}
        />
        <Veld
          label="Tel#"
          name="tel"
          defaultValue={String(v.tel ?? '')}
          error={state.fieldErrors?.tel}
        />
        <Veld
          label="E-mailadres"
          name="email_adres"
          type="email"
          defaultValue={String(v.email_adres ?? '')}
          error={state.fieldErrors?.email_adres}
          hint="Laat leeg als de klant geen e-mailadres heeft."
        />
        <Veld
          label="Status"
          name="status"
          defaultValue={String(v.status ?? '')}
          error={state.fieldErrors?.status}
        />
        <Veld
          label="Opmerking 2"
          name="opmerking_2"
          defaultValue={String(v.opmerking_2 ?? '')}
          error={state.fieldErrors?.opmerking_2}
          textarea
        />
      </Sectie>

      <Sectie titel="Voortgang">
        <Checkbox
          label="Pinpas aangeleverd"
          name="pinpas_aangeleverd"
          defaultChecked={Boolean(v.pinpas_aangeleverd)}
        />
        <Checkbox
          label="Contact gemaakt met klant"
          name="contact_gemaakt_klant"
          defaultChecked={Boolean(v.contact_gemaakt_klant)}
        />
      </Sectie>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
        <Link
          href="/front-office"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? 'Bezig...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Sectie({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {titel}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Veld({
  label,
  name,
  required,
  defaultValue,
  error,
  type = 'text',
  hint,
  textarea,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
  type?: string;
  hint?: string;
  textarea?: boolean;
}) {
  return (
    <div className={textarea ? 'sm:col-span-2' : ''}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={3}
          defaultValue={defaultValue}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
      />
      {label}
    </label>
  );
}