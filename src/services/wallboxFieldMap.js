// Mappa dei campi del vero modulo AcroForm Braba
// (estratta da Monzastraße Langen_J_2026-07-14_ACE0511153.pdf con pdf-lib)
// Ogni voce collega una chiave semantica usata dallo state del wizard
// al nome esatto del campo nel PDF originale.

// ---- Pagina 1: dati generali, Besichtigen, Erproben --------------------

export const TEXT_FIELDS = {
  'auftraggeber.name': 'Name1',
  'auftraggeber.firma': 'Firma',
  'auftraggeber.anschrift': 'Anschrift',
  'auftraggeber.tel': 'Tel',

  'pruefer.name': 'Name12',
  'pruefer.firma': 'Firma2',
  'pruefer.anschrift': 'Anschrift2',
  'pruefer.tel': 'Tel2',

  'ladestation.anschrift': 'Anschrift3',
  'ladestation.hersteller': 'Hersteller Typ',
  'ladestation.modell': 'Modell',
  'ladestation.seriennr': 'SN',
  'ladestation.fehlerstromerkennung': 'RCD',
  'ladestation.anzLadepunkte': 'Zahl',
  'ladestation.anschlussart': 'Anschluss',

  'grund.sonstigeText': 'Instandsetzung', // riusa il nome auto-generato Word per la riga libera "________"
  'evbVnb': 'EVBVNB',

  'messgeraet.hersteller': 'Hersteller',
  'messgeraet.modell': 'Text34',
  'messgeraet.seriennr': 'Text35',
  'messgeraet.kalibrierdatum': 'Text36',

  'adapter.hersteller': 'Hersteller3',
  'adapter.modell': 'Text343',
  'adapter.seriennr': 'Text353',
  'adapter.kalibrierdatum': 'Text363',

  'besichtigen.sonstigesLabel': 'Anzeigeelemente', // riga libera colonna destra "__________________"

  'uPruef': 'comb_11',
  'naechsterPrueftermin': 'Nächster Prüftermin',
  'bemerkung': 'Bemerkung',

  'abschluss.ort': 'Ort', // campo unico, compare sia lato Auftraggeber che Prüfer
  'abschluss.datumAuftraggeber': 'Datum',
  'abschluss.datumPruefer': 'Datum_2',
};

// Checkbox singole (non tri-state), valore booleano
export const CHECKBOXES = {
  'grund.neuanlage': 'Neuanlage',
  'grund.wiederholung': 'Wiederholungsprüfung',
  'grund.instandsetzung': 'undefined', // 3° checkbox Grund der Prüfung
  'grund.sonstige': 'Check Box11', // 4° checkbox, riga libera

  'netzform.tncs': 'TNCS',
  'netzform.tns': 'TNS',
  'netzform.it': 'IT',
  'netzform.tt': 'TT',

  'pruefungNach.dinvde0100600': 'DINVDE 0100600',
  'pruefungNach.dinvde0105100': 'DINVDE 0105100',
  'pruefungNach.dguv3': 'DGUV Vorschrift 3',

  'ergebnis.keineMaengel': 'Prüfergebnis keine Mängel festgestellt',
  'ergebnis.maengel': 'Mängel festgestellt',
  'durchgaengigkeit': 'toggle_1',

  'abschluss.auftraggeberUebergabe': 'Gemäß Übergabebericht elektrische Anlage funktionsfähig übernommen',
  'abschluss.auftraggeberMaengelbericht': 'undefined_15',
  'abschluss.pruferEntsprichtJa': 'k1',
  'abschluss.pruferEntsprichtNein': 'Die Anlage entspricht nicht den anerkannten Regeln der Elektrotechnik',
};

// Besichtigen: 13 voci a 3 stati (i.O. / n.i.O. / entfällt) + 1 riga libera
export const BESICHTIGEN_ITEMS = [
  { key: 'auswahlBetriebsmittel', label: 'Auswahl der Betriebsmittel', io: 'Check Box12', nio: 'Check Box16', entfaellt: 'Check Box17' },
  { key: 'trennSchaltgeraete', label: 'Trenn- & Schaltgeräte', io: 'Check Box13', nio: 'Check Box18', entfaellt: 'Check Box19' },
  { key: 'gehaeuse', label: 'Gehäuse der Anlage', io: 'Check Box14', nio: 'Check Box20', entfaellt: 'Check Box21' },
  { key: 'beruehrungsschutz', label: 'Berührungsschutz', io: 'Check Box15', nio: 'Check Box22', entfaellt: 'Check Box23' },
  { key: 'ladekabelSteckdose', label: 'Zustand Ladekabel / Steckdose', io: 'Check Box24', nio: 'Check Box25', entfaellt: 'Check Box26' },
  { key: 'kennzeichnung', label: 'Kennzeichnung der Betriebsmittel', io: 'Check Box27', nio: 'Check Box28', entfaellt: 'Check Box29' },
  { key: 'keineUeberlastung', label: 'Keine Anzeichen von Überlastung', io: 'Check Box30', nio: 'Check Box31', entfaellt: 'Check Box32' },
  { key: 'zugentlastung', label: 'Zugentlastung', io: 'Check Box37', nio: 'Check Box41', entfaellt: 'Check Box45' },
  { key: 'ipSchutzart', label: 'IP-Schutzart eingehalten', io: 'Check Box38', nio: 'Check Box42', entfaellt: 'Check Box46' },
  { key: 'dokumentation', label: 'Dokumentation', io: 'Check Box39', nio: 'Check Box43', entfaellt: 'Check Box47' },
  { key: 'zugaenglichkeit', label: 'Zugänglichkeit', io: 'Check Box40', nio: 'Check Box44', entfaellt: 'Check Box48' },
  { key: 'leiterverbindung', label: 'Leiterverbindung', io: 'Check Box51', nio: 'Check Box50', entfaellt: 'Check Box49' },
  { key: 'anzeigeelemente', label: 'Anzeigeelemente', io: 'Check Box54', nio: 'Check Box53', entfaellt: 'Check Box52' },
  { key: 'sonstiges', label: null, io: 'Check Box55', nio: 'Check Box56', entfaellt: 'Check Box57', freeLabel: true },
];

// Erproben: 6 voci a 3 stati
export const ERPROBEN_ITEMS = [
  { key: 'freischaltung', label: 'Freischaltung Ladevorgang (RFID, APP)', io: 'Check Box58', nio: 'Check Box59', entfaellt: 'Check Box60' },
  { key: 'statusA', label: 'Status A — Kein Fahrzeug angeschlossen', io: 'Check Box61', nio: 'Check Box62', entfaellt: 'Check Box63' },
  { key: 'statusB', label: 'Status B — Buchse hat verriegelt', io: 'Check Box64', nio: 'Check Box65', entfaellt: 'Check Box66' },
  { key: 'fehlerstromschutzschalter', label: 'Fehlerstromschutzschalter', io: 'Check Box67', nio: 'Check Box68', entfaellt: 'Check Box69' },
  { key: 'statusC', label: 'Status C — Ladevorgang startet', io: 'Check Box70', nio: 'Check Box71', entfaellt: 'Check Box72' },
  { key: 'statusE', label: 'Status E — Fehlersimulation, Abbruch Ladevorgang', io: 'Check Box73', nio: 'Check Box74', entfaellt: 'Check Box75' },
];

// Messung: 5 righe disponibili nel modulo originale, ognuna con lo stesso set di sotto-campi
export const MESSUNG_ROW_FIELDS = [
  {
    bmk: 'BMKRow1', stromkreis: 'StromkreisRow1',
    kabelTyp: 'LeitungKabel Typ Ader   Quers zahl mm²Row1', ader: 'LeitungKabel Typ Ader   Quers zahl mm²Row1_2', querschnitt: 'LeitungKabel Typ Ader   Quers zahl mm²Row1_3',
    isoVSchuetz: 'fill_10', isoNSchuetz: 'fill_11',
    art: 'ZS', inA: 'Text80', zs: 'Text93', zsIk: 'ZS IK', zi: 'Text94', ziIk: 'Text95',
    rcdTyp: 'In Typ', rcdIn: 'Text108', iDeltaN: 'Text113', iA: 'Text114', tA: 'Text115', uB: 'Text116',
  },
  {
    bmk: 'BMKRow2', stromkreis: 'StromkreisRow2',
    kabelTyp: 'LeitungKabel Typ Ader   Quers zahl mm²Row2', ader: 'LeitungKabel Typ Ader   Quers zahl mm²Row2_2', querschnitt: 'LeitungKabel Typ Ader   Quers zahl mm²Row2_3',
    isoVSchuetz: 'fill_17', isoNSchuetz: 'fill_18',
    art: 'Text76', inA: 'Text81', zs: 'Text92', zsIk: 'Text85', zi: 'Text96', ziIk: 'Text97',
    rcdTyp: 'Text104', rcdIn: 'Text109', iDeltaN: 'Text121', iA: 'Text127', tA: 'Text128', uB: 'Text117',
  },
  {
    bmk: 'BMKRow3', stromkreis: 'StromkreisRow3',
    kabelTyp: 'LeitungKabel Typ Ader   Quers zahl mm²Row3', ader: 'LeitungKabel Typ Ader   Quers zahl mm²Row3_2', querschnitt: 'LeitungKabel Typ Ader   Quers zahl mm²Row3_3',
    isoVSchuetz: 'fill_24', isoNSchuetz: 'fill_25',
    art: 'Text77', inA: 'Text82', zs: 'Text91', zsIk: 'Text86', zi: 'Text98', ziIk: 'Text99',
    rcdTyp: 'Text105', rcdIn: 'Text110', iDeltaN: 'Text122', iA: 'Text129', tA: 'Text130', uB: 'Text118',
  },
  {
    bmk: 'BMKRow4', stromkreis: 'StromkreisRow4',
    kabelTyp: 'LeitungKabel Typ Ader   Quers zahl mm²Row4', ader: 'LeitungKabel Typ Ader   Quers zahl mm²Row4_2', querschnitt: 'LeitungKabel Typ Ader   Quers zahl mm²Row4_3',
    isoVSchuetz: 'fill_31', isoNSchuetz: 'fill_32',
    art: 'Text78', inA: 'Text83', zs: 'Text90', zsIk: 'Text87', zi: 'Text100', ziIk: 'Text101',
    rcdTyp: 'Text106', rcdIn: 'Text111', iDeltaN: 'Text123', iA: 'Text131', tA: 'Text132', uB: 'Text119',
  },
  {
    bmk: 'BMKRow5', stromkreis: 'StromkreisRow5',
    kabelTyp: 'LeitungKabel Typ Ader   Quers zahl mm²Row5', ader: 'LeitungKabel Typ Ader   Quers zahl mm²Row5_2', querschnitt: 'LeitungKabel Typ Ader   Quers zahl mm²Row5_3',
    isoVSchuetz: 'fill_38', isoNSchuetz: 'fill_39',
    art: 'Text79', inA: 'Text84', zs: 'Text89', zsIk: 'Text88', zi: 'Text102', ziIk: 'Text103',
    rcdTyp: 'Text107', rcdIn: 'Text112', iDeltaN: 'Text124', iA: 'Text125', tA: 'Text126', uB: 'Text120',
  },
];

// Le due foto e le due firme non sono campi AcroForm standard nel PDF originale
// (sono immagini disegnate a mano libera / pulsanti immagine). Li posizioniamo
// disegnando direttamente sull'pagina alle coordinate del rettangolo del widget
// originale (per le foto) o stimate visivamente (per le firme, da verificare
// nel primo test reale).
export const IMAGE_TARGETS = {
  fotoPruefplakette: { page: 1, x: 62.9, y: 339.2, width: 196.6, height: 148.5 },
  fotoWallboxStatus: { page: 1, x: 302.1, y: 163.4, width: 231.1, height: 324.3 },
  unterschriftAuftraggeber: { page: 1, x: 175, y: 72, width: 110, height: 26 },
  unterschriftPruefer: { page: 1, x: 405, y: 72, width: 110, height: 26 },
};

export const TEMPLATE_URL = process.env.PUBLIC_URL + '/assets/wallbox-template.pdf';
