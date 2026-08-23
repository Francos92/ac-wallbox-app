import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import TriState from './components/TriState';
import SignaturePad from './components/SignaturePad';
import PhotoCapture from './components/PhotoCapture';
import { BESICHTIGEN_ITEMS, ERPROBEN_ITEMS } from './services/wallboxFieldMap';
import { generateWallboxPDF, pdfFileName, downloadBlob } from './services/pdfGenerator';
import { saveDraft, deleteDraft, saveArchiveEntry, getActiveDraft, getProfile } from './services/database';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`);

const setPath = (obj, path, value) => {
  const keys = path.split('.');
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
};
const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

const emptyMessungRow = () => ({
  bmk: '', stromkreis: '', kabelTyp: '', ader: '', querschnitt: '',
  isoVSchuetz: '>999', isoNSchuetz: '>999',
  art: '', inA: '', zs: '', zsIk: '', zi: '', ziIk: '',
  rcdTyp: '', rcdIn: '', iDeltaN: '', iA: '', tA: '', uB: '',
});

function createInitialState(profile) {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: uid(),
    moduleType: 'wallbox',
    status: 'draft',
    createdAt: new Date().toISOString(),
    auftraggeber: { name: '', firma: '', anschrift: '', tel: '' },
    pruefer: {
      name: profile?.pruefer?.name || 'Branko Pavlovic',
      firma: profile?.pruefer?.firma || 'BraBa Elektrotechnik',
      anschrift: profile?.pruefer?.anschrift || 'Frankenstr. 5 - 65183 Wiesbaden',
      tel: profile?.pruefer?.tel || '0611 510 521 09',
    },
    ladestation: { anschrift: '', hersteller: '', modell: '', seriennr: '', fehlerstromerkennung: '', anzLadepunkte: '1', anschlussart: 'Buchse, Typ2' },
    grund: { type: 'wiederholung', sonstigeText: '' },
    netzform: 'TNCS',
    pruefungNach: { dinvde0100600: false, dinvde0105100: false, dguv3: true },
    evbVnb: '',
    messgeraet: {
      hersteller: profile?.messgeraet?.hersteller || 'Benning',
      modell: profile?.messgeraet?.modell || 'IT130',
      seriennr: profile?.messgeraet?.seriennr || '',
      kalibrierdatum: profile?.messgeraet?.kalibrierdatum || '',
    },
    adapter: {
      hersteller: profile?.adapter?.hersteller || 'Benning',
      modell: profile?.adapter?.modell || 'EV 3-2',
      seriennr: profile?.adapter?.seriennr || '',
      kalibrierdatum: profile?.adapter?.kalibrierdatum || '',
    },
    besichtigen: { sonstigesLabel: '' },
    erproben: {},
    messung: [emptyMessungRow()],
    uPruef: '500',
    durchgaengigkeit: true,
    ergebnis: null,
    naechsterPrueftermin: '',
    fotos: { pruefplakette: null, wallboxStatus: null },
    bemerkung: '',
    abschluss: {
      auftraggeberUebergabe: false,
      auftraggeberMaengelbericht: false,
      pruferEntspricht: null,
      ort: profile?.ort || 'Wiesbaden',
      datumAuftraggeber: '',
      datumPruefer: today,
      unterschriftAuftraggeber: null,
      unterschriftPruefer: null,
    },
  };
}

// ---------------------------------------------------------------------
// Piccoli campi riutilizzabili
// ---------------------------------------------------------------------
function Field({ label, path, state, update, type = 'text', placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={getPath(state, path) ?? ''}
        placeholder={placeholder}
        onChange={(e) => update(path, e.target.value)}
      />
    </label>
  );
}

// Ableitung der Kurzform ("A"/"B") aus der gewählten Fehlerstromerkennung,
// für das RCD-Typ-Feld in der Messung-Tabelle.
const rcdShortCode = (value) => {
  if (value === 'Typ A') return 'A';
  if (value === 'Typ B') return 'B';
  return value || '';
};

function FehlerstromerkennungField({ state, setState }) {
  const value = state.ladestation.fehlerstromerkennung;
  const isPreset = value === '' || value === 'Typ A' || value === 'Typ B';
  const selectValue = isPreset ? value : 'custom';

  const applyValue = (newValue) => {
    setState((s) => {
      const shortCode = rcdShortCode(newValue);
      const messung = s.messung.map((row) => (row.rcdTyp ? row : { ...row, rcdTyp: shortCode }));
      return { ...s, ladestation: { ...s.ladestation, fehlerstromerkennung: newValue }, messung };
    });
  };

  return (
    <label className="field">
      <span>Fehlerstromerkennung</span>
      <select
        value={selectValue}
        onChange={(e) => applyValue(e.target.value === 'custom' ? '' : e.target.value)}
      >
        <option value="">– wählen –</option>
        <option value="Typ A">Typ A</option>
        <option value="Typ B">Typ B</option>
        <option value="custom">Andere…</option>
      </select>
      {selectValue === 'custom' && (
        <input
          type="text"
          placeholder="z.B. Typ F, Typ B+"
          value={value}
          onChange={(e) => applyValue(e.target.value)}
          style={{ marginTop: 8 }}
        />
      )}
    </label>
  );
}

function BigChoice({ label, options, value, onChange }) {
  return (
    <div className="bigchoice">
      {label && <div className="bigchoice-label">{label}</div>}
      <div className="bigchoice-options">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            className={`bigchoice-btn ${value === opt.value ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Step: Auftraggeber & Ladestation
// ---------------------------------------------------------------------
function StepAuftraggeber({ state, update, setState }) {
  const handleAnzLadepunkteChange = (raw) => {
    setState((s) => {
      const target = Math.min(5, Math.max(0, parseInt(raw, 10) || 0));
      let messung = s.messung;
      if (target > messung.length) {
        const shortCode = rcdShortCode(s.ladestation.fehlerstromerkennung);
        const toAdd = target - messung.length;
        messung = [
          ...messung,
          ...Array.from({ length: toAdd }, () => ({ ...emptyMessungRow(), rcdTyp: shortCode })),
        ];
      }
      return { ...s, ladestation: { ...s.ladestation, anzLadepunkte: raw }, messung };
    });
  };

  return (
    <div className="step">
      <h2>Auftraggeber</h2>
      <div className="field-grid">
        <Field label="Name" path="auftraggeber.name" state={state} update={update} />
        <Field label="Firma" path="auftraggeber.firma" state={state} update={update} />
        <Field label="Anschrift" path="auftraggeber.anschrift" state={state} update={update} />
        <Field label="Tel." path="auftraggeber.tel" state={state} update={update} />
      </div>

      <h2>Ladestation</h2>
      <div className="field-grid">
        <Field label="Anschrift der Ladestation" path="ladestation.anschrift" state={state} update={update} />
        <Field label="Hersteller" path="ladestation.hersteller" state={state} update={update} />
        <Field label="Modell" path="ladestation.modell" state={state} update={update} />
        <Field label="Serien-Nr." path="ladestation.seriennr" state={state} update={update} />
        <FehlerstromerkennungField state={state} setState={setState} />
        <label className="field">
          <span>Anz. Ladepunkte</span>
          <input
            type="number"
            min="1"
            max="5"
            value={state.ladestation.anzLadepunkte}
            onChange={(e) => handleAnzLadepunkteChange(e.target.value)}
          />
        </label>
        <Field label="Anschlussart" path="ladestation.anschlussart" state={state} update={update} />
      </div>
    </div>
  );
}
StepAuftraggeber.isValid = (s) =>
  !!s.auftraggeber.name && !!s.ladestation.anschrift && !!s.ladestation.hersteller &&
  !!s.ladestation.modell && !!s.ladestation.seriennr;

// ---------------------------------------------------------------------
// Step: Prüfer & Messgeräte
// ---------------------------------------------------------------------
function StepPruefer({ state, update }) {
  return (
    <div className="step">
      <h2>Prüfer</h2>
      <div className="field-grid">
        <Field label="Name" path="pruefer.name" state={state} update={update} />
        <Field label="Firma" path="pruefer.firma" state={state} update={update} />
        <Field label="Anschrift" path="pruefer.anschrift" state={state} update={update} />
        <Field label="Tel." path="pruefer.tel" state={state} update={update} />
      </div>

      <h2>Verwendetes Messgerät</h2>
      <div className="field-grid">
        <Field label="Hersteller" path="messgeraet.hersteller" state={state} update={update} />
        <Field label="Modell" path="messgeraet.modell" state={state} update={update} />
        <Field label="Serien-Nr." path="messgeraet.seriennr" state={state} update={update} />
        <Field label="Kalibrierdatum" path="messgeraet.kalibrierdatum" state={state} update={update} type="date" />
      </div>

      <h2>Adapter</h2>
      <div className="field-grid">
        <Field label="Hersteller" path="adapter.hersteller" state={state} update={update} />
        <Field label="Modell" path="adapter.modell" state={state} update={update} />
        <Field label="Serien-Nr." path="adapter.seriennr" state={state} update={update} />
        <Field label="Kalibrierdatum" path="adapter.kalibrierdatum" state={state} update={update} type="date" />
      </div>
    </div>
  );
}
StepPruefer.isValid = (s) => !!s.pruefer.name && !!s.messgeraet.hersteller;

// ---------------------------------------------------------------------
// Step: Grund, Netzform, Prüfung nach
// ---------------------------------------------------------------------
function StepGrund({ state, update }) {
  return (
    <div className="step">
      <h2>Grund der Prüfung</h2>
      <BigChoice
        options={[
          { value: 'neuanlage', label: 'Neuanlage' },
          { value: 'wiederholung', label: 'Wiederholungsprüfung' },
          { value: 'instandsetzung', label: 'Instandsetzung' },
          { value: 'sonstige', label: 'Sonstiges' },
        ]}
        value={state.grund.type}
        onChange={(v) => update('grund.type', v)}
      />
      {state.grund.type === 'sonstige' && (
        <Field label="Grund (frei)" path="grund.sonstigeText" state={state} update={update} />
      )}

      <h2>Netzform</h2>
      <BigChoice
        options={[
          { value: 'TNCS', label: 'TN-C-S' },
          { value: 'TNS', label: 'TN-S' },
          { value: 'IT', label: 'IT' },
          { value: 'TT', label: 'TT' },
        ]}
        value={state.netzform}
        onChange={(v) => update('netzform', v)}
      />

      <h2>Prüfung nach</h2>
      <div className="checkbox-list">
        <label>
          <input type="checkbox" checked={!!state.pruefungNach.dinvde0100600}
            onChange={(e) => update('pruefungNach.dinvde0100600', e.target.checked)} />
          DIN-VDE 0100-600
        </label>
        <label>
          <input type="checkbox" checked={!!state.pruefungNach.dinvde0105100}
            onChange={(e) => update('pruefungNach.dinvde0105100', e.target.checked)} />
          DIN-VDE 0105-100
        </label>
        <label>
          <input type="checkbox" checked={!!state.pruefungNach.dguv3}
            onChange={(e) => update('pruefungNach.dguv3', e.target.checked)} />
          DGUV Vorschrift 3
        </label>
      </div>

      <h2>EVB/VNB</h2>
      <Field label="EVB/VNB" path="evbVnb" state={state} update={update} />
    </div>
  );
}
StepGrund.isValid = (s) => {
  const pn = s.pruefungNach;
  return !!s.grund.type && !!s.netzform && (pn.dinvde0100600 || pn.dinvde0105100 || pn.dguv3);
};

// ---------------------------------------------------------------------
// Master-Toggle: setzt/räumt alle TriState-Positionen einer Gruppe auf i.O.
// ---------------------------------------------------------------------
function MasterIOToggle({ allChecked, onToggle }) {
  return (
    <label className={`master-io-row ${allChecked ? 'active' : ''}`}>
      <input type="checkbox" checked={allChecked} onChange={onToggle} />
      <span>Alle auf i.O. setzen</span>
    </label>
  );
}

// ---------------------------------------------------------------------
// Step: Besichtigen
// ---------------------------------------------------------------------
function StepBesichtigen({ state, update, setState }) {
  const items = BESICHTIGEN_ITEMS.filter((it) => !it.freeLabel);
  const allIO = items.every((it) => state.besichtigen[it.key] === 'io');

  const toggleAllIO = () => {
    setState((s) => ({
      ...s,
      besichtigen: {
        ...s.besichtigen,
        ...Object.fromEntries(items.map((it) => [it.key, allIO ? null : 'io'])),
      },
    }));
  };

  return (
    <div className="step">
      <h2>Besichtigen</h2>
      <p className="step-hint">Für jede Position i.O. / n.i.O. / entfällt wählen.</p>
      <MasterIOToggle allChecked={allIO} onToggle={toggleAllIO} />
      {items.map((item) => (
        <TriState
          key={item.key}
          label={item.label}
          value={state.besichtigen[item.key]}
          onChange={(v) => update(`besichtigen.${item.key}`, v)}
        />
      ))}
      <div className="free-row">
        <input
          type="text"
          placeholder="Weitere Position (optional)"
          value={state.besichtigen.sonstigesLabel || ''}
          onChange={(e) => update('besichtigen.sonstigesLabel', e.target.value)}
        />
        <TriState
          value={state.besichtigen.sonstiges}
          onChange={(v) => update('besichtigen.sonstiges', v)}
        />
      </div>
    </div>
  );
}
StepBesichtigen.isValid = (s) =>
  BESICHTIGEN_ITEMS.filter((it) => !it.freeLabel).every((it) => !!s.besichtigen[it.key]);

// ---------------------------------------------------------------------
// Step: Erproben
// ---------------------------------------------------------------------
function StepErproben({ state, update, setState }) {
  const allIO = ERPROBEN_ITEMS.every((it) => state.erproben[it.key] === 'io');

  const toggleAllIO = () => {
    setState((s) => ({
      ...s,
      erproben: {
        ...s.erproben,
        ...Object.fromEntries(ERPROBEN_ITEMS.map((it) => [it.key, allIO ? null : 'io'])),
      },
    }));
  };

  return (
    <div className="step">
      <h2>Erproben</h2>
      <p className="step-hint">Für jede Position i.O. / n.i.O. / entfällt wählen.</p>
      <MasterIOToggle allChecked={allIO} onToggle={toggleAllIO} />
      {ERPROBEN_ITEMS.map((item) => (
        <TriState
          key={item.key}
          label={item.label}
          value={state.erproben[item.key]}
          onChange={(v) => update(`erproben.${item.key}`, v)}
        />
      ))}
    </div>
  );
}
StepErproben.isValid = (s) => ERPROBEN_ITEMS.every((it) => !!s.erproben[it.key]);

// ---------------------------------------------------------------------
// Step: Messung
// ---------------------------------------------------------------------
function MessungRow({ row, index, update }) {
  const p = (key) => `messung.${index}.${key}`;
  const set = (key, val) => update(p(key), val);
  return (
    <div className="messung-row">
      <div className="messung-row-title">Stromkreis {index + 1}</div>
      <div className="field-grid">
        <label className="field"><span>BMK.</span><input value={row.bmk} onChange={(e) => set('bmk', e.target.value)} placeholder="z.B. F1" /></label>
        <label className="field"><span>Stromkreis</span><input value={row.stromkreis} onChange={(e) => set('stromkreis', e.target.value)} placeholder="z.B. Links" /></label>
        <label className="field"><span>Kabel-Typ</span><input value={row.kabelTyp} onChange={(e) => set('kabelTyp', e.target.value)} placeholder="z.B. NYY-J" /></label>
        <label className="field"><span>Aderzahl</span><input value={row.ader} onChange={(e) => set('ader', e.target.value)} placeholder="z.B. 5" /></label>
        <label className="field"><span>Querschnitt [mm²]</span><input value={row.querschnitt} onChange={(e) => set('querschnitt', e.target.value)} placeholder="z.B. 5x2,5" /></label>
        <label className="field"><span>Isowiderstand v.Schütz [MΩ]</span><input value={row.isoVSchuetz} onChange={(e) => set('isoVSchuetz', e.target.value)} placeholder="z.B. >999" /></label>
        <label className="field"><span>Isowiderstand n.Schütz [MΩ]</span><input value={row.isoNSchuetz} onChange={(e) => set('isoNSchuetz', e.target.value)} placeholder="z.B. >999" /></label>
        <label className="field"><span>Art (B/C/D)</span><input value={row.art} onChange={(e) => set('art', e.target.value)} placeholder="z.B. C" /></label>
        <label className="field"><span>IN [A]</span><input value={row.inA} onChange={(e) => set('inA', e.target.value)} placeholder="z.B. 32" /></label>
        <label className="field"><span>Zs [Ω]</span><input value={row.zs} onChange={(e) => set('zs', e.target.value)} placeholder="z.B. 0,35" /></label>
        <label className="field"><span>Ik (bei Zs) [A]</span><input value={row.zsIk} onChange={(e) => set('zsIk', e.target.value)} placeholder="z.B. 657" /></label>
        <label className="field"><span>Zi [Ω]</span><input value={row.zi} onChange={(e) => set('zi', e.target.value)} placeholder="z.B. 0,42" /></label>
        <label className="field"><span>Ik (bei Zi) [A]</span><input value={row.ziIk} onChange={(e) => set('ziIk', e.target.value)} placeholder="z.B. 550" /></label>
        <label className="field"><span>RCD Typ</span><input value={row.rcdTyp} onChange={(e) => set('rcdTyp', e.target.value)} placeholder="z.B. A" /></label>
        <label className="field"><span>RCD In [A]</span><input value={row.rcdIn} onChange={(e) => set('rcdIn', e.target.value)} placeholder="z.B. 63" /></label>
        <label className="field"><span>I∆N [mA]</span><input value={row.iDeltaN} onChange={(e) => set('iDeltaN', e.target.value)} placeholder="z.B. 30" /></label>
        <label className="field"><span>IA [mA]</span><input value={row.iA} onChange={(e) => set('iA', e.target.value)} placeholder="z.B. 21" /></label>
        <label className="field"><span>tA [ms]</span><input value={row.tA} onChange={(e) => set('tA', e.target.value)} placeholder="z.B. 25" /></label>
        <label className="field"><span>UB [V]</span><input value={row.uB} onChange={(e) => set('uB', e.target.value)} placeholder="z.B. 24" /></label>
      </div>
    </div>
  );
}

function StepMessung({ state, update, setState }) {
  const addRow = () => {
    if (state.messung.length >= 5) return;
    setState((s) => ({ ...s, messung: [...s.messung, emptyMessungRow()] }));
  };
  const removeRow = (index) => {
    setState((s) => ({ ...s, messung: s.messung.filter((_, i) => i !== index) }));
  };
  return (
    <div className="step">
      <h2>Messung</h2>
      <Field label="Isowiderstand — Uprüf [V]" path="uPruef" state={state} update={update} />
      {state.messung.map((row, i) => (
        <div key={i}>
          <MessungRow row={row} index={i} update={update} />
          {state.messung.length > 1 && (
            <button type="button" className="btn-secondary" onClick={() => removeRow(i)}>Stromkreis entfernen</button>
          )}
        </div>
      ))}
      {state.messung.length < 5 && (
        <button type="button" className="btn-secondary" onClick={addRow}>+ Stromkreis hinzufügen</button>
      )}
    </div>
  );
}
// Messung ist absichtlich nie blockierend: nicht jede Position ist bei jeder
// Prüfung relevant, daher darf man auch mit leeren Feldern weiter.
StepMessung.isValid = () => true;

// ---------------------------------------------------------------------
// Step: Ergebnis & Fotos
// ---------------------------------------------------------------------
function StepErgebnis({ state, update }) {
  return (
    <div className="step">
      <h2>Ergebnis</h2>
      <label className="checkbox-line">
        <input type="checkbox" checked={!!state.durchgaengigkeit}
          onChange={(e) => update('durchgaengigkeit', e.target.checked)} />
        Durchgängigkeit Schutzleiter ≤ 0,2 Ω (nachgewiesen)
      </label>

      <BigChoice
        label="Prüfergebnis"
        options={[
          { value: 'keineMaengel', label: 'keine Mängel festgestellt' },
          { value: 'maengel', label: 'Mängel festgestellt' },
        ]}
        value={state.ergebnis}
        onChange={(v) => update('ergebnis', v)}
      />

      <Field label="Nächster Prüftermin" path="naechsterPrueftermin" state={state} update={update} type="date" />
      <Field label="Bemerkung (optional)" path="bemerkung" state={state} update={update} />

      <h2>Fotos</h2>
      <div className="photo-grid">
        <PhotoCapture
          label="Bild: Prüfplakette"
          value={state.fotos.pruefplakette}
          onChange={(v) => update('fotos.pruefplakette', v)}
        />
        <PhotoCapture
          label="Bild: Wallboxstatus nach Prüfung"
          value={state.fotos.wallboxStatus}
          onChange={(v) => update('fotos.wallboxStatus', v)}
        />
      </div>
    </div>
  );
}
StepErgebnis.isValid = (s) =>
  !!s.ergebnis && !!s.naechsterPrueftermin && !!s.fotos.pruefplakette && !!s.fotos.wallboxStatus;

// ---------------------------------------------------------------------
// Step: Abschluss & Unterschriften
// ---------------------------------------------------------------------
function StepAbschluss({ state, update }) {
  return (
    <div className="step">
      <h2>Auftraggeber</h2>
      <label className="checkbox-line">
        <input type="checkbox" checked={!!state.abschluss.auftraggeberUebergabe}
          onChange={(e) => update('abschluss.auftraggeberUebergabe', e.target.checked)} />
        Gemäß Übergabebericht elektrische Anlage funktionsfähig übernommen
      </label>
      <label className="checkbox-line">
        <input type="checkbox" checked={!!state.abschluss.auftraggeberMaengelbericht}
          onChange={(e) => update('abschluss.auftraggeberMaengelbericht', e.target.checked)} />
        Mängelbericht erhalten (nur bei Wiederholungsprüfung)
      </label>

      <h2>Prüfer</h2>
      <BigChoice
        options={[
          { value: true, label: 'entspricht den anerkannten Regeln' },
          { value: false, label: 'entspricht NICHT den Regeln' },
        ]}
        value={state.abschluss.pruferEntspricht}
        onChange={(v) => update('abschluss.pruferEntspricht', v)}
      />

      <div className="field-grid">
        <Field label="Ort" path="abschluss.ort" state={state} update={update} />
        <Field label="Datum (Auftraggeber)" path="abschluss.datumAuftraggeber" state={state} update={update} type="date" />
        <Field label="Datum (Prüfer)" path="abschluss.datumPruefer" state={state} update={update} type="date" />
      </div>

      <h2>Unterschriften</h2>
      <div className="signature-grid">
        <SignaturePad
          label="Auftraggeber"
          value={state.abschluss.unterschriftAuftraggeber}
          onChange={(v) => update('abschluss.unterschriftAuftraggeber', v)}
        />
        <SignaturePad
          label="Prüfer"
          value={state.abschluss.unterschriftPruefer}
          onChange={(v) => update('abschluss.unterschriftPruefer', v)}
        />
      </div>
    </div>
  );
}
StepAbschluss.isValid = (s) =>
  !!s.abschluss.ort && !!s.abschluss.datumPruefer && s.abschluss.pruferEntspricht !== null &&
  !!s.abschluss.unterschriftAuftraggeber && !!s.abschluss.unterschriftPruefer;

// ---------------------------------------------------------------------
// Step: Zusammenfassung & Export
// ---------------------------------------------------------------------
function StepReview({ state, allSteps, jumpTo, onExport, exporting }) {
  return (
    <div className="step">
      <h2>Zusammenfassung</h2>
      <p className="step-hint">Alle Abschnitte müssen abgeschlossen sein, bevor das PDF erstellt wird.</p>
      <div className="review-list">
        {allSteps.slice(0, -1).map((step, i) => {
          const ok = step.isValid ? step.isValid(state) : true;
          return (
            <button type="button" key={step.title} className={`review-item ${ok ? 'ok' : 'incomplete'}`} onClick={() => jumpTo(i)}>
              <span>{ok ? '✓' : '!'}</span> {step.title}
            </button>
          );
        })}
      </div>
      <button type="button" className="btn-primary btn-large" disabled={exporting} onClick={onExport}>
        {exporting ? 'PDF wird erstellt…' : 'Prüfbericht als PDF erstellen'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Wizard shell
// ---------------------------------------------------------------------
const STEPS = [
  { title: 'Auftraggeber & Ladestation', Component: StepAuftraggeber, isValid: StepAuftraggeber.isValid },
  { title: 'Prüfer & Messgeräte', Component: StepPruefer, isValid: StepPruefer.isValid },
  { title: 'Grund & Normen', Component: StepGrund, isValid: StepGrund.isValid },
  { title: 'Besichtigen', Component: StepBesichtigen, isValid: StepBesichtigen.isValid },
  { title: 'Erproben', Component: StepErproben, isValid: StepErproben.isValid },
  { title: 'Messung', Component: StepMessung, isValid: StepMessung.isValid },
  { title: 'Ergebnis & Fotos', Component: StepErgebnis, isValid: StepErgebnis.isValid },
  { title: 'Abschluss & Unterschriften', Component: StepAbschluss, isValid: StepAbschluss.isValid },
  { title: 'Fertigstellen', Component: null, isValid: () => true },
];

export default function WallboxWizard({ onExit }) {
  const [state, setState] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState('');
  const saveTimer = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      const existing = await getActiveDraft('wallbox');
      if (existing) {
        existing.messung = (existing.messung || []).map((row) => ({
          isoVSchuetz: '>999',
          isoNSchuetz: '>999',
          ...row,
        }));
      }
      setState(existing || createInitialState(profile));
      initialized.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!initialized.current || !state) return;
    setSaveIndicator('Speichern…');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveDraft(state);
      setSaveIndicator('Gespeichert ✓');
    }, 400);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const update = useCallback((path, value) => {
    setState((s) => setPath(s, path, value));
  }, []);

  const currentStep = STEPS[stepIndex];
  const currentValid = useMemo(() => (state && currentStep.isValid ? currentStep.isValid(state) : true), [state, currentStep]);

  if (!state) return <div className="loading">Lädt…</div>;

  const goNext = () => {
    if (!currentValid) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    window.scrollTo(0, 0);
  };
  const goBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
    window.scrollTo(0, 0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await generateWallboxPDF(state);
      const filename = pdfFileName(state);
      downloadBlob(blob, filename);
      await saveArchiveEntry({
        id: state.id,
        moduleType: 'wallbox',
        filename,
        pdfBlob: blob,
        summary: {
          anschrift: state.ladestation.anschrift,
          auftraggeber: state.auftraggeber.name,
          datum: state.abschluss.datumPruefer,
          ergebnis: state.ergebnis,
        },
      });
      await deleteDraft(state.id);
      const profile = await getProfile();
      setState(createInitialState(profile));
      setStepIndex(0);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      alert('Fehler beim Erstellen des PDFs: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const progress = Math.round((stepIndex / (STEPS.length - 1)) * 100);

  return (
    <div className="wizard">
      <header className="wizard-header">
        <button type="button" className="btn-link" onClick={onExit}>← Hauptmenü</button>
        <div className="wizard-title">{currentStep.title}</div>
        <div className="save-indicator">{saveIndicator}</div>
      </header>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <main className="wizard-body">
        {currentStep.Component ? (
          <currentStep.Component state={state} update={update} setState={setState} />
        ) : (
          <StepReview
            state={state}
            allSteps={STEPS}
            jumpTo={(i) => { setStepIndex(i); window.scrollTo(0, 0); }}
            onExport={handleExport}
            exporting={exporting}
          />
        )}
      </main>

      {currentStep.Component && (
        <footer className="wizard-footer">
          <button type="button" className="btn-secondary" onClick={goBack} disabled={stepIndex === 0}>Zurück</button>
          <button type="button" className="btn-primary" onClick={goNext} disabled={!currentValid}>
            Weiter
          </button>
        </footer>
      )}
    </div>
  );
}
