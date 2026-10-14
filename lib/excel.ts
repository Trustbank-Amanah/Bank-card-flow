// lib/excel.ts
import * as XLSX from 'xlsx';

/**
 * Parseert een Excel (.xlsx, .xls) of CSV-bestand naar een array van objecten.
 * De eerste rij wordt als header gezien.
 *
 * - .xlsx / .xls → via SheetJS
 * - .csv / .txt  → via SheetJS (die snapt ook CSV)
 *
 * Lege cellen worden als lege string ('') teruggegeven, nooit als undefined.
 */
export async function parseSpreadsheet(
  file: File
): Promise<Record<string, string>[]> {
  const arrayBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    // Belangrijk: cellDates: false → datums komen als serial numbers of strings
    // We willen alles als tekst zodat we zelf kunnen parsen.
    cellDates: false,
    // raw: false → alle cellen als string (formatteert datums/getallen)
    raw: false,
  });

  const eersteSheetNaam = workbook.SheetNames[0];
  if (!eersteSheetNaam) {
    return [];
  }

  const sheet = workbook.Sheets[eersteSheetNaam];

  // header: 1 → eerste rij is header, rest zijn data
  // defval: '' → lege cellen worden ''
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: 1,
    defval: '',
    raw: false, // formatteer datums als strings i.p.v. serial numbers
    blankrows: false,
  });

  if (rows.length === 0) return [];

  const headerRow = rows[0] as unknown as string[];
  const headers = headerRow.map((h) => String(h ?? '').trim());

  const resultaat: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown as unknown[];
    if (!row || row.length === 0) continue;

    // Skip rijen die helemaal leeg zijn
    const heeftData = row.some((cel) => {
      const s = String(cel ?? '').trim();
      return s !== '';
    });
    if (!heeftData) continue;

    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (!h) return; // skip lege header-kolommen
      const waarde = row[idx];
      obj[h] = waarde == null ? '' : String(waarde).trim();
    });
    resultaat.push(obj);
  }

  return resultaat;
}

/** Parseert boolean-waarden uit Excel: 'ja','j','true','1','x','yes','y' → true */
export function parseBool(waarde: string | undefined | null): boolean {
  if (!waarde) return false;
  const v = String(waarde).trim().toLowerCase();
  return ['ja', 'j', 'true', '1', 'x', 'yes', 'y'].includes(v);
}