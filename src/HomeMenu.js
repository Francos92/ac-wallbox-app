import React from 'react';

const MODULES = [
  { id: 'wallbox', title: 'AC-Ladestation / Wallbox', subtitle: 'DIN-VDE 0100-600 · DGUV V3', icon: '🔌', active: true },
  { id: 'pv', title: 'PV-Anlage', subtitle: 'Demnächst verfügbar', icon: '☀️', active: false },
  { id: 'erdung', title: 'Erdungsanlage', subtitle: 'Demnächst verfügbar', icon: '⏚', active: false },
];

export default function HomeMenu({ onSelectModule, onOpenArchive, onOpenProfile }) {
  return (
    <div className="home">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-name">BraBa</span>
          <span className="home-brand-sub">ELEKTROTECHNIK</span>
        </div>
        <button type="button" className="btn-icon" onClick={onOpenProfile} title="Profil-Einstellungen">⚙️</button>
      </header>

      <h1 className="home-title">Prüfprotokoll erstellen</h1>

      <div className="module-grid">
        {MODULES.map((m) => (
          <button
            type="button"
            key={m.id}
            className={`module-card ${m.active ? '' : 'module-card-disabled'}`}
            disabled={!m.active}
            onClick={() => m.active && onSelectModule(m.id)}
          >
            <span className="module-icon">{m.icon}</span>
            <span className="module-title">{m.title}</span>
            <span className="module-subtitle">{m.subtitle}</span>
          </button>
        ))}
      </div>

      <button type="button" className="archive-link" onClick={onOpenArchive}>
        📁 Meine Protokolle
      </button>
    </div>
  );
}
