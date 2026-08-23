import React, { useEffect, useRef, useState } from 'react';
import { getWallboxListe, saveWallboxListe, listArchive } from './services/database';
import { parseWallboxListeFile, wallboxListeRowToState } from './services/wallboxListeImport';

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

export default function StepWallboxListe({ state, setState, goNext }) {
  const [liste, setListe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [doneSerials, setDoneSerials] = useState(new Set());
  const [query, setQuery] = useState('');
  const fileInputRef = useRef(null);

  const loadDoneSerials = async (currentListe) => {
    if (!currentListe) {
      setDoneSerials(new Set());
      return;
    }
    const archive = await listArchive('wallbox');
    const done = archive
      .filter((e) => e.summary?.seriennr && new Date(e.savedAt) >= new Date(currentListe.loadedAt))
      .map((e) => e.summary.seriennr);
    setDoneSerials(new Set(done));
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

  const selectRow = (row) => {
    const prefill = wallboxListeRowToState(row);
    setState((s) => ({
      ...s,
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
      <button
        type="button"
        className="btn-primary"
        disabled={importing}
        onClick={() => fileInputRef.current.click()}
      >
        {importing ? 'Wird geladen…' : liste ? 'Neue Liste laden' : 'Liste laden (Excel)'}
      </button>

      {error && <p className="wl-error">{error}</p>}

      {loading ? (
        <p className="step-hint">Lädt…</p>
      ) : !liste ? (
        <p className="step-hint">Noch keine Liste geladen. Du kannst auch ohne Liste fortfahren und die Daten manuell eingeben.</p>
      ) : (
        <>
          <p className="wl-meta">
            {rows.length} Wallboxen · geladen am {new Date(liste.loadedAt).toLocaleDateString('de-DE')} ·{' '}
            {doneSerials.size} erledigt
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
              const done = row.seriennummer && doneSerials.has(row.seriennummer);
              const selected = row.seriennummer && row.seriennummer === currentSeriennr;
              return (
                <button
                  type="button"
                  key={`${row.seriennummer}-${i}`}
                  className={`wl-row ${done ? 'wl-row-done' : ''} ${selected ? 'wl-row-selected' : ''}`}
                  onClick={() => selectRow(row)}
                >
                  <div className="wl-row-main">
                    <span className="wl-row-title">{row.bezeichnung || '(ohne Bezeichnung)'}</span>
                    <span className="wl-row-sub">
                      {row.strasse} {row.hausnr}, {row.plz} {row.ort}
                    </span>
                  </div>
                  <div className="wl-row-meta">
                    <span>{row.seriennummer}</span>
                    {row.naechstePruefung && <span>fällig {formatDate(row.naechstePruefung)}</span>}
                    {done && <span className="wl-row-badge">✓ erledigt</span>}
                  </div>
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
