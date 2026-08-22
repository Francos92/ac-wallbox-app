import React from 'react';

// Grande gruppo di 3 bottoni a stato (i.O. / n.i.O. / entfällt) pensato per il tocco.
export default function TriState({ label, value, onChange }) {
  const options = [
    { key: 'io', text: 'i.O.', className: 'tristate-io' },
    { key: 'nio', text: 'n.i.O.', className: 'tristate-nio' },
    { key: 'entfaellt', text: 'entfällt', className: 'tristate-entfaellt' },
  ];
  return (
    <div className={`tristate-row ${value ? 'tristate-answered' : 'tristate-unanswered'}`}>
      {label && <span className="tristate-label">{label}</span>}
      <div className="tristate-buttons">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.key}
            className={`tristate-btn ${opt.className} ${value === opt.key ? 'active' : ''}`}
            onClick={() => onChange(opt.key)}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
