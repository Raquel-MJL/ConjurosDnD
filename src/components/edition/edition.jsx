import React from 'react';

// Selector de edición del Manual del Jugador: cambia el listado completo de conjuros.
const EditionToggle = ({ editions, value, onChange }) => (
  <div className="edition-toggle mb-6" role="group" aria-label="Versión del Manual del Jugador">
    {editions.map(e => (
      <button
        key={e.id}
        type="button"
        aria-pressed={value === e.id}
        onClick={() => onChange(e.id)}
        className="edition-btn"
      >
        {e.label}
      </button>
    ))}
  </div>
);

export { EditionToggle };
