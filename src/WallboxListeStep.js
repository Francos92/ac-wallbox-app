import React, { useEffect, useRef, useState } from 'react';
import { getWallboxListe, saveWallboxListe, deleteWallboxListe, listArchive } from './services/database';
import { parseWallboxListeFile, wallboxListeRowToState } from './services/wallboxListeImport';

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

function formatDateTime(isoDateTime) {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('de-DE');
  const timePart = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} um ${timePart} Uhr`;
}

export default function StepWallboxListe({ state, setState, goNext }) {
  const [liste, setListe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [doneMap, setDoneMap] = useState(new Map());
  const [query, setQuery] = useState('');
  const [confirmStep, setConfirmStep] = useState(0); // 0=aus, 1=erste Warnung, 2=letzte Warnung
  const fileInputRef = useRef(null);

  const loadDoneSerials = async (currentListe) => {
    if (!currentListe) {
      setDoneMap(new Map());
      return;
    }
    const archive = await listArchive('wallbox');
    const map = new Map();
    archive
      .filter((e) => e.summary?.seriennr && new Date(e.savedAt) >= new Date(currentListe.loadedAt))
      .forEach((e) => {
        // Bei Mehrfach-Prüfungen derselben Wallbox den neuesten Zeitstempel behalten.
        const existing = map.get(e.summary.seriennr);
        if (!existing || new Date(e.savedAt) > new Date(existing)) {
          map.set(e.summary.seriennr, e.savedAt);
        }
      });
    setDoneMap(map);
  };

  useEffect(() => {
    (async () => {
      const stored = await getWallboxListe();
      setListe(stored);
      await loadDoneSerials(stored);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const { rows } = await parseWallboxListeFile(file);
      if (rows.length === 0) throw new Error('leer');
      const saved = await saveWallboxListe(rows);
      setListe(saved);
      await loadDoneSerials(saved);
    } catch (err) {
      setError('Datei konnte nicht gelesen werden. Bitte die Original-Exceldatei (Blatt "Offen (Groß) Monat") verwenden.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteConfirmed = async () => {
    await deleteWallboxListe();
    setListe(null);
    setDoneMap(new Map());
    setQuery('');
    setConfirmStep(0);
  };

  const selectRow = (row) => {
    const prefill = wallboxListeRowToState(row);
    setState((s) => ({
      ...s,
      pruefintervall: prefill.pruefintervall,
      ladestation: { ...s.ladestation, ...prefill.ladestation },
    }));
    goNext();
  };

  const rows = liste?.rows || [];
  const filtered = query.trim()
    ? rows.filter((r) =>
        [r.bezeichnung, r.strasse, r.ort, r.seriennummer]
          .join(' ')
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      )
    : rows;

  const currentSeriennr = state?.ladestation?.seriennr;

  return (
    <div className="step">
      <h2>Wallbox-Liste laden</h2>
      <p className="step-hint">
        Excel-Liste (Blatt "Offen (Groß) Monat") laden — daraus wird die Liste der fälligen
        Wallbox-Prüfungen erzeugt. Auf eine Wallbox tippen füllt Auftraggeber &amp; Ladestation
        automatisch aus.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <div className="wl-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={importing}
          onClick={() => fileInputRef.current.click()}
        >
          {importing ? 'Wird geladen…' : liste ? 'Neue Liste laden' : 'Liste laden (Excel)'}
        </button>
        {liste && (
          <button type="button" className="btn-secondary" onClick={() => loadDoneSerials(liste)}>
            🔄 Erledigt-Status aktualisieren
          </button>
        )}
        {liste && (
          <button type="button" className="btn-danger" onClick={() => setConfirmStep(1)}>
            Liste löschen
          </button>
        )}
      </div>

      {error && <p className="wl-error">{error}</p>}

      {confirmStep === 1 && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Liste wirklich löschen?</h3>
            <p>
              Die geladene Liste mit {rows.length} Wallboxen und der Erledigt-Status werden entfernt.
              Bereits gespeicherte Prüfprotokolle im Archiv bleiben davon unberührt.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmStep(0)}>Abbrechen</button>
              <button type="button" className="btn-danger" onClick={() => setConfirmStep(2)}>Ja, löschen</button>
            </div>
          </div>
        </div>
      )}
      {confirmStep === 2 && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Bist du wirklich sicher?</h3>
            <p>Das kann nicht rückgängig gemacht werden. Die Liste muss danach neu aus Excel geladen werden.</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmStep(0)}>Abbrechen</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirmed}>Ja, endgültig löschen</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="step-hint">Lädt…</p>
      ) : !liste ? (
        <p className="step-hint">Noch keine Liste geladen. Du kannst auch ohne Liste fortfahren und die Daten manuell eingeben.</p>
      ) : (
        <>
          <p className="wl-meta">
            {rows.length} Wallboxen · geladen am {new Date(liste.loadedAt).toLocaleDateString('de-DE')} ·{' '}
            {doneMap.size} erledigt
          </p>
          <input
            type="text"
            className="wl-search"
            placeholder="Suchen (Ort, Bezeichnung, Seriennummer)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="wl-list">
            {filtered.map((row, i) => {
              const doneAt = row.seriennummer ? doneMap.get(row.seriennummer) : null;
              const done = !!doneAt;
              const selected = row.seriennummer && row.seriennummer === currentSeriennr;
              return (
                <button
                  type="button"
                  key={`${row.seriennummer}-${i}`}
                  className={`wl-row ${done ? 'wl-row-done' : ''} ${selected ? 'wl-row-selected' : ''}`}
                  onClick={() => selectRow(row)}
                >
                  <div className="wl-row-body">
                    <div className="wl-row-main">
                      <span className="wl-row-title">{row.bezeichnung || '(ohne Bezeichnung)'}</span>
                      <span className="wl-row-sub">
                        {row.strasse} {row.hausnr}, {row.plz} {row.ort}
                      </span>
                    </div>
                    {done && (
                      <div className="wl-row-donetime">✓ erledigt am {formatDateTime(doneAt)}</div>
                    )}
                    <div className="wl-row-meta">
                      <span>{row.seriennummer}</span>
                      {row.naechstePruefung && <span>fällig {formatDate(row.naechstePruefung)}</span>}
                    </div>
                  </div>
                  <span
                    className={`wl-row-tag ${row.pruefart === 'J' ? 'wl-row-tag-j' : 'wl-row-tag-h'}`}
                    title={row.pruefart === 'J' ? 'jährliche Prüfung' : 'halbjährliche Prüfung'}
                  >
                    {row.pruefart}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="step-hint">Keine Treffer.</p>}
          </div>
        </>
      )}
    </div>
  );
}
