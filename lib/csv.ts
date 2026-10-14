// lib/csv.ts

/**
 * Parseert CSV-tekst naar een array van objecten.
 * Ondersteunt:
 *  - komma als scheidingsteken
 *  - quoted fields ("...")
 *  - escaped quotes ("")
 *  - regeleindes \n en \r\n
 */
export function parseCsv(tekst: string): Record<string, string>[] {
  const rows = parseRijen(tekst);
  if (rows.length === 0) return [];

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((h) => h.trim());

  return dataRows
    .filter((r) => r.some((c) => c.trim() !== '')) // skip lege rijen
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = (r[i] ?? '').trim();
      });
      return obj;
    });
}

function parseRijen(tekst: string): string[][] {
  const rijen: string[][] = [];
  let huidigeRij: string[] = [];
  let huidigVeld = '';
  let inQuotes = false;
  let i = 0;

  // Verwijder BOM indien aanwezig
  if (tekst.charCodeAt(0) === 0xfeff) {
    tekst = tekst.slice(1);
  }

  while (i < tekst.length) {
    const c = tekst[i];

    if (inQuotes) {
      if (c === '"') {
        if (tekst[i + 1] === '"') {
          huidigVeld += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        huidigVeld += c;
        i++;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
      } else if (c === ',') {
        huidigeRij.push(huidigVeld);
        huidigVeld = '';
        i++;
      } else if (c === '\n') {
        huidigeRij.push(huidigVeld);
        rijen.push(huidigeRij);
        huidigeRij = [];
        huidigVeld = '';
        i++;
      } else if (c === '\r') {
        // skip, \n handelt de rij af
        i++;
      } else {
        huidigVeld += c;
        i++;
      }
    }
  }

  // Laatste veld/rij
  if (huidigVeld !== '' || huidigeRij.length > 0) {
    huidigeRij.push(huidigVeld);
    rijen.push(huidigeRij);
  }

  return rijen;
}

/** Parseert boolean-waarden uit Excel/CSV: 'ja','j','true','1','x','yes' → true */
export function parseBool(waarde: string | undefined): boolean {
  if (!waarde) return false;
  const v = waarde.trim().toLowerCase();
  return ['ja', 'j', 'true', '1', 'x', 'yes', 'y'].includes(v);
}