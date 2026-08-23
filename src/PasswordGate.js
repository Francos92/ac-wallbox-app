import React, { useState } from 'react';

const PASSWORD = '0743';
const STORAGE_KEY = 'braba-unlock-date';

// Tagesschlüssel im lokalen Zeitzone-Kontext (nicht UTC), damit die Sperre
// wirklich um Mitternacht des Geräts neu greift, nicht um Mitternacht UTC.
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isUnlockedToday() {
  try {
    return localStorage.getItem(STORAGE_KEY) === todayKey();
  } catch (e) {
    return false;
  }
}

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(isUnlockedToday);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      try {
        localStorage.setItem(STORAGE_KEY, todayKey());
      } catch (err) {
        // Speicher nicht verfügbar (z.B. privater Modus) — Sperre gilt dann
        // nur für die aktuelle Sitzung.
      }
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
    }
  };

  if (unlocked) return children;

  return (
    <div className="password-gate">
      <form className="password-gate-box" onSubmit={handleSubmit}>
        <div className="password-gate-brand">
          <span className="home-brand-name">BraBa</span>
          <span className="home-brand-sub">ELEKTROTECHNIK</span>
        </div>
        <label className="field">
          <span>Zugangscode</span>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
          />
        </label>
        {error && <p className="password-gate-error">Falscher Code.</p>}
        <button type="submit" className="btn-primary btn-large">Entsperren</button>
      </form>
    </div>
  );
}
