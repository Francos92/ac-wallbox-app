import * as XLSX from 'xlsx';

// Die monatliche ESWE-Liste enthält zwei Blätter mit fälligen Prüfungen:
// "Groß" = jährliche Prüfung (Kennzeichen "J"), "Klein" = halbjährliche
// Prüfung (Kennzeichen "H"). Spaltenaufbau ist bei beiden identisch, nur
// die Spalte mit dem Fälligkeitsdatum heißt jeweils anders.
const SHEETS = [
  { name: 'Offen (Groß) Monat', pruefart: 'J', naechstePruefungSpalte: 'Nächste große Prüfung' },
  { name: 'Offen (Klein) Monat', pruefart: 'H', naechstePruefungSpalte: 'Nächste kleine Prüfung' },
];

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

  const parsed = SHEETS.flatMap(({ name, pruefart, naechstePruefungSpalte }) => {
    if (!workbook.SheetNames.includes(name)) return [];
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    return rows
      .map((row) => ({
        pruefart,
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
        naechstePruefung: excelDateToIso(row[naechstePruefungSpalte]),
        bemerkung: String(row[COLUMNS.bemerkung] || '').trim(),
      }))
      // Leere/Kopfzeilen ohne echte Wallbox überspringen
      .filter((r) => r.bezeichnung || r.seriennummer);
  });

  return { rows: parsed };
}

// Auftraggeber ist immer ESWE/Michael Rogles (fixer Standard, siehe
// createInitialState) — aus der Wallbox-Liste übernommen wird nur die
// Ladestation: Anschrift, Hersteller, Modell und Serien-Nr.
export function wallboxListeRowToState(row) {
  const addressParts = [`${row.strasse} ${row.hausnr}`.trim(), `${row.plz} ${row.ort}`.trim()]
    .filter(Boolean)
    .join(', ');
  return {
    pruefintervall: row.pruefart || '',
    ladestation: {
      anschrift: addressParts,
      hersteller: row.hersteller || '',
      modell: row.typ || '',
      seriennr: row.seriennummer || '',
      // Sauberer "Straße Ort"-Ausschnitt (ohne Hausnr./PLZ) für den
      // PDF-Dateinamen — direkt aus den strukturierten Excel-Spalten,
      // zuverlässiger als ihn später aus dem freien Anschrift-Text zu raten.
      strasseOrtHint: `${row.strasse} ${row.ort}`.trim(),
    },
  };
}
