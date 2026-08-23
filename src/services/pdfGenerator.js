import { PDFDocument, PDFTextField, PDFCheckBox, rgb } from 'pdf-lib';
import {
  TEXT_FIELDS,
  BESICHTIGEN_ITEMS,
  ERPROBEN_ITEMS,
  MESSUNG_ROW_FIELDS,
  IMAGE_TARGETS,
  TEMPLATE_URL,
} from './wallboxFieldMap';

const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

let templateBytesCache = null;
async function loadTemplateBytes() {
  if (templateBytesCache) return templateBytesCache;
  const res = await fetch(TEMPLATE_URL);
  templateBytesCache = await res.arrayBuffer();
  return templateBytesCache;
}

function setTextSafe(form, name, value) {
  if (!name) return;
  try {
    const field = form.getField(name);
    if (field instanceof PDFTextField) field.setText(value == null ? '' : String(value));
  } catch (e) {
    console.warn('Textfeld nicht gefunden:', name);
  }
}

function setCheckSafe(form, name, checked) {
  if (!name) return;
  try {
    const field = form.getField(name);
    if (field instanceof PDFCheckBox) {
      if (checked) field.check();
      else field.uncheck();
    }
  } catch (e) {
    console.warn('Checkbox nicht gefunden:', name);
  }
}

function clearAllFields(form) {
  form.getFields().forEach((f) => {
    if (f instanceof PDFTextField) f.setText('');
    else if (f instanceof PDFCheckBox) f.uncheck();
  });
}

function fillTriState(form, items, stateGroup) {
  items.forEach((item) => {
    const value = stateGroup ? stateGroup[item.key] : null; // 'io' | 'nio' | 'entfaellt' | undefined
    setCheckSafe(form, item.io, value === 'io');
    setCheckSafe(form, item.nio, value === 'nio');
    setCheckSafe(form, item.entfaellt, value === 'entfaellt');
  });
}

// Deckt die Zielzone blickdicht weiß ab, bevor etwas Neues gezeichnet wird.
// Notwendig, weil im Original-Template (Monzastraße-Beispiel) an diesen Stellen
// noch das alte Beispielfoto bzw. die handschriftliche Unterschrift von Branko
// direkt im Seiteninhalt eingebettet ist (keine Formularfelder, kann nicht
// über das Form-API geleert werden).
function coverWithWhite(page, target) {
  page.drawRectangle({ x: target.x, y: target.y, width: target.width, height: target.height, color: rgb(1, 1, 1) });
}

async function drawImageContain(pdfDoc, page, dataUrl, target) {
  coverWithWhite(page, target);
  if (!dataUrl) return;
  const isPng = dataUrl.startsWith('data:image/png');
  const base64 = dataUrl.split(',')[1];
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const image = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

  const boxRatio = target.width / target.height;
  const imgRatio = image.width / image.height;
  let drawWidth, drawHeight;
  if (imgRatio > boxRatio) {
    drawWidth = target.width;
    drawHeight = target.width / imgRatio;
  } else {
    drawHeight = target.height;
    drawWidth = target.height * imgRatio;
  }
  const x = target.x + (target.width - drawWidth) / 2;
  const y = target.y + (target.height - drawHeight) / 2;
  page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });
}

export async function generateWallboxPDF(state) {
  const templateBytes = await loadTemplateBytes();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();

  clearAllFields(form);

  // -- campi testo diretti (dot-path) --
  Object.entries(TEXT_FIELDS).forEach(([path, fieldName]) => {
    setTextSafe(form, fieldName, getPath(state, path));
  });

  // -- Grund der Prüfung (selezione singola tra 4) --
  const grundType = state.grund?.type; // 'neuanlage' | 'wiederholung' | 'instandsetzung' | 'sonstige'
  setCheckSafe(form, 'Neuanlage', grundType === 'neuanlage');
  setCheckSafe(form, 'Wiederholungsprüfung', grundType === 'wiederholung');
  setCheckSafe(form, 'undefined', grundType === 'instandsetzung');
  setCheckSafe(form, 'Check Box11', grundType === 'sonstige');

  // -- Netzform (selezione singola tra 4) --
  const netzform = state.netzform; // 'TNCS' | 'TNS' | 'IT' | 'TT'
  setCheckSafe(form, 'TNCS', netzform === 'TNCS');
  setCheckSafe(form, 'TNS', netzform === 'TNS');
  setCheckSafe(form, 'IT', netzform === 'IT');
  setCheckSafe(form, 'TT', netzform === 'TT');

  // -- Prüfung nach (selezione multipla) --
  const pn = state.pruefungNach || {};
  setCheckSafe(form, 'DINVDE 0100600', !!pn.dinvde0100600);
  setCheckSafe(form, 'DINVDE 0105100', !!pn.dinvde0105100);
  setCheckSafe(form, 'DGUV Vorschrift 3', !!pn.dguv3);

  // -- Besichtigen / Erproben (tri-state) --
  fillTriState(form, BESICHTIGEN_ITEMS, state.besichtigen);
  fillTriState(form, ERPROBEN_ITEMS, state.erproben);

  // -- Messung (fino a 5 righe) --
  const messungRows = state.messung || [];
  MESSUNG_ROW_FIELDS.forEach((rowFields, i) => {
    const row = messungRows[i];
    if (!row) return;
    Object.entries(rowFields).forEach(([key, fieldName]) => {
      setTextSafe(form, fieldName, row[key]);
    });
  });

  // -- Prüfergebnis --
  setCheckSafe(form, 'Prüfergebnis keine Mängel festgestellt', state.ergebnis === 'keineMaengel');
  setCheckSafe(form, 'Mängel festgestellt', state.ergebnis === 'maengel');
  setCheckSafe(form, 'toggle_1', !!state.durchgaengigkeit);

  // -- Abschluss / Unterschriften --
  setCheckSafe(form, 'Gemäß Übergabebericht elektrische Anlage funktionsfähig übernommen', !!state.abschluss?.auftraggeberUebergabe);
  setCheckSafe(form, 'undefined_15', !!state.abschluss?.auftraggeberMaengelbericht);
  setCheckSafe(form, 'k1', state.abschluss?.pruferEntspricht === true);
  setCheckSafe(form, 'Die Anlage entspricht nicht den anerkannten Regeln der Elektrotechnik', state.abschluss?.pruferEntspricht === false);

  form.updateFieldAppearances();

  // Entfernt die beiden Bild-Buttons (alte Beispielfotos als Appearance) BEVOR
  // geglättet wird, damit ihre Appearance nicht mit ins geglättete PDF wandert.
  ['Prüfplakette', 'betriebsbereit'].forEach((name) => {
    try {
      const field = form.getField(name);
      form.removeField(field);
    } catch (e) {
      // Feld nicht vorhanden - ignorieren
    }
  });

  form.flatten();

  // -- immagini: foto + firme, ERST NACH dem Flatten zeichnen --
  // (Reihenfolge wichtig: so kann nichts vom geglätteten Formular mehr
  // über unseren neuen Bildern liegen. Die weiße Abdeckung in
  // drawImageContain() deckt zusätzlich die im Seiteninhalt eingebrannte
  // alte Unterschrift ab.)
  const page2 = pages[IMAGE_TARGETS.fotoPruefplakette.page];
  await drawImageContain(pdfDoc, page2, state.fotos?.pruefplakette, IMAGE_TARGETS.fotoPruefplakette);
  await drawImageContain(pdfDoc, page2, state.fotos?.wallboxStatus, IMAGE_TARGETS.fotoWallboxStatus);
  await drawImageContain(pdfDoc, page2, state.abschluss?.unterschriftAuftraggeber, IMAGE_TARGETS.unterschriftAuftraggeber);
  await drawImageContain(pdfDoc, page2, state.abschluss?.unterschriftPruefer, IMAGE_TARGETS.unterschriftPruefer);

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

// Grobe Schätzung "Straße Ort" (ohne Hausnr./PLZ) aus dem freien
// Anschrift-Text, für Prüfungen ohne Wallbox-Liste-Import. Bei Import aus
// der Excel-Liste steht mit strasseOrtHint die verlässliche Variante zur
// Verfügung (siehe wallboxListeImport.js).
function fallbackStrasseOrt(anschrift) {
  const isHouseNrOrPlz = /^\d+[a-zA-Z]?(-\d+[a-zA-Z]?)?,?$/;
  const tokens = (anschrift || '').split(/\s+/).filter((t) => t && !isHouseNrOrPlz.test(t));
  return tokens.join(' ').trim();
}

// Format wie im Referenzprotokoll: "Straße Ort_J_JJJJ-MM-TT_Seriennummer.pdf"
// ("J" = jährliche, "H" = halbjährliche Prüfung — aus der Wallbox-Liste
// übernommen, ohne Listenauswahl standardmäßig "J").
export function pdfFileName(state) {
  const strasseOrt =
    (state.ladestation?.strasseOrtHint || fallbackStrasseOrt(state.ladestation?.anschrift) || 'Wallbox')
      .replace(/[^\w\- äöüÄÖÜß]/g, '')
      .trim() || 'Wallbox';
  const intervall = state.pruefintervall || 'J';
  const date = state.abschluss?.datumPruefer || new Date().toISOString().split('T')[0];
  const sn = state.ladestation?.seriennr || '';
  return `${strasseOrt}_${intervall}_${date}_${sn}.pdf`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
