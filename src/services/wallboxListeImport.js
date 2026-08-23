import * as XLSX from 'xlsx';

// Erwartetes Blatt in der monatlichen ESWE-Liste: die offenen großen
// (jährlichen) Prüfungen. Spalten sind bei allen bisherigen Listen identisch
// aufgebaut (Stamm, Offen, Geprüft — nur der Blattname unterscheidet sich).
const SHEET_NAME = 'Offen (Groß) Monat';

const COLUMNS = {
  bezeichnung: 'Bezeichnung',
  strasse: 'Straße',
  hausnr: 'Hausnr.',
  plz: 'PLZ',
  ort: 'Ort',
  hersteller: 'Hersteller',
  typ: 'Typ',
  seriennummer: 'Seriennummer',
  absicherung: 'Absicherung',
  ansprechpartner: 'Ansprechpartner',
  ansprechpartnerTel: 'Ansprechpartner Telefon',
  ansprechpartnerMail: 'Ansprechpartner Mail',
  naechstePruefung: 'Nächste große Prüfung',
  bemerkung: 'Bemerkung',
};

function excelDateToIso(value) {
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return '';
    const mm = String(parsed.m).padStart(2, '0');
    const dd = String(parsed.d).padStart(2, '0');
    return `${parsed.y}-${mm}-${dd}`;
  }
  return value ? String(value) : '';
}

export async function parseWallboxListeFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetName = workbook.SheetNames.includes(SHEET_NAME) ? SHEET_NAME : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const parsed = rows
    .map((row) => ({
      bezeichnung: String(row[COLUMNS.bezeichnung] || '').trim(),
      strasse: String(row[COLUMNS.strasse] || '').trim(),
      hausnr: String(row[COLUMNS.hausnr] || '').trim(),
      plz: String(row[COLUMNS.plz] || '').trim(),
      ort: String(row[COLUMNS.ort] || '').trim(),
      hersteller: String(row[COLUMNS.hersteller] || '').trim(),
      typ: String(row[COLUMNS.typ] || '').trim(),
      seriennummer: String(row[COLUMNS.seriennummer] || '').trim(),
      absicherung: String(row[COLUMNS.absicherung] || '').trim(),
      ansprechpartner: String(row[COLUMNS.ansprechpartner] || '').trim(),
      ansprechpartnerTel: String(row[COLUMNS.ansprechpartnerTel] || '').trim(),
      ansprechpartnerMail: String(row[COLUMNS.ansprechpartnerMail] || '').trim(),
      naechstePruefung: excelDateToIso(row[COLUMNS.naechstePruefung]),
      bemerkung: String(row[COLUMNS.bemerkung] || '').trim(),
    }))
    // Leere/Kopfzeilen ohne echte Wallbox überspringen
    .filter((r) => r.bezeichnung || r.seriennummer);

  return { sheetName, rows: parsed };
}

// Aus der Wallbox-Liste wird bewusst NUR "Anschrift der Ladestation"
// übernommen. Auftraggeber ist immer ESWE/Michael Rogles (fixer Standard,
// siehe createInitialState) und die übrigen Ladestation-Felder (Hersteller,
// Modell, Serien-Nr.) werden weiterhin manuell vor Ort erfasst.
export function wallboxListeRowToState(row) {
  const addressParts = [`${row.strasse} ${row.hausnr}`.trim(), `${row.plz} ${row.ort}`.trim()]
    .filter(Boolean)
    .join(', ');
  return {
    ladestation: {
      anschrift: addressParts,
      // Sauberer "Straße Ort"-Ausschnitt (ohne Hausnr./PLZ) für den
      // PDF-Dateinamen — direkt aus den strukturierten Excel-Spalten,
      // zuverlässiger als ihn später aus dem freien Anschrift-Text zu raten.
      strasseOrtHint: `${row.strasse} ${row.ort}`.trim(),
    },
  };
}
