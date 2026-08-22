import React, { useRef } from 'react';

// Cattura foto diretta da fotocamera (o galleria) e la converte in dataURL.
export default function PhotoCapture({ label, value, onChange }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className={`photo-capture ${value ? 'has-photo' : ''}`}>
      <div className="photo-label">{label}</div>
      {value ? (
        <div className="photo-preview">
          <img src={value} alt={label} />
          <button type="button" className="btn-secondary" onClick={() => onChange(null)}>
            Foto entfernen
          </button>
        </div>
      ) : (
        <button type="button" className="btn-camera" onClick={() => inputRef.current.click()}>
          📷 Foto aufnehmen
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}
