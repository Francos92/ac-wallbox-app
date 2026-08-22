import React, { useEffect, useState } from 'react';
import { listArchive, deleteArchiveEntry } from './services/database';
import { downloadBlob } from './services/pdfGenerator';

export default function ArchiveView({ onExit }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    listArchive().then(setEntries);
  }, []);

  const remove = async (id) => {
    if (!window.confirm('Diesen Prüfbericht wirklich löschen?')) return;
    await deleteArchiveEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="wizard">
      <header className="wizard-header">
        <button type="button" className="btn-link" onClick={onExit}>← Hauptmenü</button>
        <div className="wizard-title">Meine Protokolle</div>
        <div />
      </header>
      <main className="wizard-body">
        {entries.length === 0 && <p className="step-hint">Noch keine abgeschlossenen Protokolle.</p>}
        <div className="archive-list">
          {entries.map((entry) => (
            <div className="archive-item" key={entry.id}>
              <div className="archive-item-info">
                <div className="archive-item-title">{entry.summary?.anschrift || entry.filename}</div>
                <div className="archive-item-sub">
                  {entry.summary?.auftraggeber} · {entry.summary?.datum} ·{' '}
                  {entry.summary?.ergebnis === 'maengel' ? 'Mängel festgestellt' : 'keine Mängel'}
                </div>
              </div>
              <div className="archive-item-actions">
                <button type="button" className="btn-secondary" onClick={() => downloadBlob(entry.pdfBlob, entry.filename)}>
                  PDF öffnen
                </button>
                <button type="button" className="btn-danger" onClick={() => remove(entry.id)}>Löschen</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
