import React, { useEffect, useState } from 'react';
import { getProfile, saveProfile } from './services/database';

const DEFAULTS = {
  pruefer: { name: 'Branko Pavlovic', firma: 'BraBa Elektrotechnik', anschrift: 'Frankenstr. 5 - 65183 Wiesbaden', tel: '0611 510 521 09' },
  messgeraet: { hersteller: 'Benning', modell: 'IT130', seriennr: '', kalibrierdatum: '' },
  adapter: { hersteller: 'Benning', modell: 'EV 3-2', seriennr: '', kalibrierdatum: '' },
  ort: 'Wiesbaden',
};

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function ProfileSettings({ onExit }) {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then((p) => setProfile(p || DEFAULTS));
  }, []);

  if (!profile) return <div className="loading">Lädt…</div>;

  const set = (section, key, value) => {
    setSaved(false);
    setProfile((p) => ({ ...p, [section]: { ...p[section], [key]: value } }));
  };

  const handleSave = async () => {
    await saveProfile(profile);
    setSaved(true);
  };

  return (
    <div className="wizard">
      <header className="wizard-header">
        <button type="button" className="btn-link" onClick={onExit}>← Hauptmenü</button>
        <div className="wizard-title">Profil-Einstellungen</div>
        <div />
      </header>
      <main className="wizard-body">
        <p className="step-hint">Diese Daten werden bei jedem neuen Protokoll automatisch vorausgefüllt.</p>

        <h2>Prüfer</h2>
        <div className="field-grid">
          <Field label="Name" value={profile.pruefer.name} onChange={(v) => set('pruefer', 'name', v)} />
          <Field label="Firma" value={profile.pruefer.firma} onChange={(v) => set('pruefer', 'firma', v)} />
          <Field label="Anschrift" value={profile.pruefer.anschrift} onChange={(v) => set('pruefer', 'anschrift', v)} />
          <Field label="Tel." value={profile.pruefer.tel} onChange={(v) => set('pruefer', 'tel', v)} />
        </div>

        <h2>Verwendetes Messgerät</h2>
        <div className="field-grid">
          <Field label="Hersteller" value={profile.messgeraet.hersteller} onChange={(v) => set('messgeraet', 'hersteller', v)} />
          <Field label="Modell" value={profile.messgeraet.modell} onChange={(v) => set('messgeraet', 'modell', v)} />
          <Field label="Serien-Nr." value={profile.messgeraet.seriennr} onChange={(v) => set('messgeraet', 'seriennr', v)} />
          <Field label="Kalibrierdatum" type="date" value={profile.messgeraet.kalibrierdatum} onChange={(v) => set('messgeraet', 'kalibrierdatum', v)} />
        </div>

        <h2>Adapter</h2>
        <div className="field-grid">
          <Field label="Hersteller" value={profile.adapter.hersteller} onChange={(v) => set('adapter', 'hersteller', v)} />
          <Field label="Modell" value={profile.adapter.modell} onChange={(v) => set('adapter', 'modell', v)} />
          <Field label="Serien-Nr." value={profile.adapter.seriennr} onChange={(v) => set('adapter', 'seriennr', v)} />
          <Field label="Kalibrierdatum" type="date" value={profile.adapter.kalibrierdatum} onChange={(v) => set('adapter', 'kalibrierdatum', v)} />
        </div>

        <h2>Standardort</h2>
        <div className="field-grid">
          <Field label="Ort" value={profile.ort} onChange={(v) => setProfile((p) => ({ ...p, ort: v }))} />
        </div>

        <button type="button" className="btn-primary btn-large" onClick={handleSave}>
          {saved ? 'Gespeichert ✓' : 'Speichern'}
        </button>
      </main>
    </div>
  );
}
