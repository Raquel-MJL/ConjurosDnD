import React, { useState } from 'react';
import { FILTER_GROUPS, countActive } from '../../lib/filters';

const MODE_LABELS = { any: 'Cualquiera', all: 'Todas' };

const Filters = ({ filters, onChange, counts, total, shown }) => {
  const [open, setOpen] = useState(false);
  const active = countActive(filters);

  const toggle = (key, value) => {
    const sel = filters[key];
    const next = sel.includes(value) ? sel.filter(v => v !== value) : [...sel, value];
    onChange({ ...filters, [key]: next });
  };
  const setMode = (key, mode) => onChange({ ...filters, modes: { ...filters.modes, [key]: mode } });
  const clearGroup = key => onChange({ ...filters, [key]: [] });
  const clearAll = () => onChange({
    ...filters,
    ...Object.fromEntries(FILTER_GROUPS.map(g => [g.key, []])),
  });

  return (
    <section className="section-card filters-card mx-auto text-left" aria-label="Filtros de conjuros">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="sectionTitle">
          Filtros{active > 0 && <span className="text-base"> ({active} marcados)</span>}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm" role="status" aria-live="polite">
            Mostrando {shown} de {total} conjuros
          </span>
          {active > 0 && (
            <button type="button" onClick={clearAll} className="text-sm px-3 py-1 rounded-md bg-white hover:bg-gray-100">
              Limpiar filtros
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-controls="panel-filtros"
            className="text-sm px-3 py-1 rounded-md bg-white hover:bg-gray-100"
          >
            {open ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
        </div>
      </div>

      {open && (
        <div id="panel-filtros" className="filters-grid mt-4">
          {FILTER_GROUPS.map(group => (
            <fieldset key={group.key} className="filter-group min-w-0">
              <legend className="filter-legend">
                <span>{group.label}</span>
                {filters[group.key].length > 0 && (
                  <button type="button" onClick={() => clearGroup(group.key)} className="filter-clear border-0">
                    quitar
                  </button>
                )}
              </legend>

              {group.modes && (
                <div className="mode-toggle" role="group" aria-label={`Coincidencia en ${group.label}`}>
                  {Object.entries(MODE_LABELS).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={filters.modes[group.key] === mode}
                      onClick={() => setMode(group.key, mode)}
                      className="mode-btn border-0"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <ul className="chip-list">
                {group.options.map(o => (
                  <li key={o.value}>
                    <label className="chip">
                      <input
                        type="checkbox"
                        className="chip-input"
                        checked={filters[group.key].includes(o.value)}
                        onChange={() => toggle(group.key, o.value)}
                      />
                      <span className="chip-body">
                        <span>{o.label}</span>
                        <span className="chip-count">{counts[group.key][o.value]}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
        </div>
      )}
    </section>
  );
};

export { Filters };
