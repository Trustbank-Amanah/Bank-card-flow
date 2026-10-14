// app/(app)/admin/import/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { parseSpreadsheet, parseBool } from '@/lib/excel';

export interface ImportResultaat {
  ok: boolean;
  imported: number;
  skipped: number;
  errors: { rij: number; reden: string; id_nummer?: string }[];
  algemeneFout?: string;
}

// Mapping van Excel-kolomnamen naar DB-veldnamen.
// Hoofdletterongevoelig, whitespace wordt genormaliseerd.
const KOLOM_MAPPING: Record<string, string> = {
  naam: 'naam',
  voornaam: 'voornaam',
  'id nummer': 'id_nummer',
  id_nummer: 'id_nummer',
  idnummer: 'id_nummer',
  'additional reference': 'additional_reference',
  additional_reference: 'additional_reference',
  reference: 'additional_reference',
  'tel#': 'tel',
  tel: 'tel',
  telefoon: 'tel',
  'email adres': 'email_adres',
  email: 'email_adres',
  email_adres: 'email_adres',
  status: 'status',
  'opmerking 2': 'opmerking_2',
  opmerking_2: 'opmerking_2',
  opmerking2: 'opmerking_2',
  'pinpas aangeleverd': 'pinpas_aangeleverd',
  pinpas_aangeleverd: 'pinpas_aangeleverd',
  'contact gemkt klant': 'contact_gemaakt_klant',
  'contact gemaakt klant': 'contact_gemaakt_klant',
  contact_gemaakt_klant: 'contact_gemaakt_klant',
  afgehaald: 'afgehaald',
  'email alert added': 'email_alert_added',
  email_alert_added: 'email_alert_added',
};

function normaliseerHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function importeerBestandAction(
  _prev: ImportResultaat | null,
  formData: FormData
): Promise<ImportResultaat> {
  await requireRole(['ADMIN']);

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      errors: [],
      algemeneFout: 'Geen bestand geselecteerd.',
    };
  }

  // Bestandstype check
  const naam = file.name.toLowerCase();
  const isExcel = naam.endsWith('.xlsx') || naam.endsWith('.xls');
  const isCsv = naam.endsWith('.csv') || naam.endsWith('.txt');
  if (!isExcel && !isCsv) {
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      errors: [],
      algemeneFout:
        'Alleen .xlsx, .xls of .csv bestanden worden ondersteund.',
    };
  }

  let rawRows: Record<string, string>[];
  try {
    rawRows = await parseSpreadsheet(file);
  } catch (err) {
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      errors: [],
      algemeneFout:
        err instanceof Error
          ? `Kon het bestand niet lezen: ${err.message}`
          : 'Kon het bestand niet lezen.',
    };
  }

  if (rawRows.length === 0) {
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      errors: [],
      algemeneFout: 'Het bestand bevat geen gegevensrijen.',
    };
  }

  // Map kolommen
  const rows: Record<string, unknown>[] = [];
  const fouten: ImportResultaat['errors'] = [];

  rawRows.forEach((raw, idx) => {
    const mapped: Record<string, unknown> = {};

    for (const [rawKey, rawValue] of Object.entries(raw)) {
      const norm = normaliseerHeader(rawKey);
      const dbKey = KOLOM_MAPPING[norm];
      if (dbKey) {
        mapped[dbKey] = rawValue;
      }
    }

    // Booleans
    mapped.pinpas_aangeleverd = parseBool(
      String(mapped.pinpas_aangeleverd ?? '')
    );
    mapped.contact_gemaakt_klant = parseBool(
      String(mapped.contact_gemaakt_klant ?? '')
    );
    mapped.afgehaald = parseBool(String(mapped.afgehaald ?? ''));
    mapped.email_alert_added = parseBool(
      String(mapped.email_alert_added ?? '')
    );

    // Lege strings → null (behalve de verplichte velden, die checken we zo)
    for (const key of Object.keys(mapped)) {
      if (
        typeof mapped[key] === 'string' &&
        (mapped[key] as string).trim() === ''
      ) {
        mapped[key] = null;
      }
    }

    // Validatie verplichte velden
    const missend: string[] = [];
    if (!mapped.naam) missend.push('Naam');
    if (!mapped.id_nummer) missend.push('ID nummer');
    if (!mapped.additional_reference) missend.push('Additional reference');

    if (missend.length > 0) {
      fouten.push({
        rij: idx + 2, // +2: header + 1-based
        reden: `Verplichte velden ontbreken: ${missend.join(', ')}`,
        id_nummer: (mapped.id_nummer as string) ?? undefined,
      });
      return;
    }

    rows.push(mapped);
  });

  if (rows.length === 0) {
    return {
      ok: false,
      imported: 0,
      skipped: fouten.length,
      errors: fouten,
      algemeneFout: 'Geen geldige rijen gevonden om te importeren.',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('import_customers', {
    p_rows: rows,
  });

  if (error) {
    return {
      ok: false,
      imported: 0,
      skipped: fouten.length,
      errors: fouten,
      algemeneFout: error.message,
    };
  }

  const result = Array.isArray(data) ? data[0] : data;
  const rpcErrors = (result?.errors ?? []) as {
    id_nummer?: string;
    additional_reference?: string;
    reason?: string;
  }[];

  const alleFouten: ImportResultaat['errors'] = [
    ...fouten,
    ...rpcErrors.map((e) => ({
      rij: 0,
      reden: e.reason ?? 'Onbekende fout',
      id_nummer: e.id_nummer,
    })),
  ];

  return {
    ok: true,
    imported: result?.imported ?? 0,
    skipped: (result?.skipped ?? 0) + fouten.length,
    errors: alleFouten,
  };
}