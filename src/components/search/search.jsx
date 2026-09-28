import React from 'react';

const Search = ({ value, onChange }) => (
  <section className="section-card search-card mx-auto text-left" aria-label="Buscador de conjuros">
    <div className="search-field">
      <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 21 21" />
      </svg>
      <input
        type="search"
        className="search-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Buscar por nombre o contenido del conjuro…"
        aria-label="Buscar conjuros por nombre o contenido"
        autoComplete="off"
      />
      {value && (
        <button type="button" className="search-clear border-0" onClick={() => onChange('')} aria-label="Borrar búsqueda">
          ✕
        </button>
      )}
    </div>
  </section>
);

export { Search };
