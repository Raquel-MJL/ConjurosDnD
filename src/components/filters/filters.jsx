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
        <div id="panel-filtros" className="section-panel mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FILTER_GROUPS.map(group => (
            <fieldset key={group.key} className="min-w-0">
              <legend className="font-semibold mb-1 flex items-center gap-2">
                {group.label}
                {filters[group.key].length > 0 && (
                  <button type="button" onClick={() => clearGroup(group.key)} className="text-xs underline font-normal bg-transparent p-0 border-0 hover:border-0">
                    quitar
                  </button>
                )}
              </legend>

              {group.modes && (
                <div className="flex items-center gap-1 mb-1 text-xs" role="group" aria-label={`Coincidencia en ${group.label}`}>
                  <span>Coincidir con:</span>
                  {Object.entries(MODE_LABELS).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={filters.modes[group.key] === mode}
                      onClick={() => setMode(group.key, mode)}
                      className={`px-2 py-0.5 rounded ${filters.modes[group.key] === mode ? 'bg-gray-300 font-semibold' : 'bg-gray-50'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <ul className="space-y-1">
                {group.options.map(o => (
                  <li key={o.value}>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 [color-scheme:light]"
                        checked={filters[group.key].includes(o.value)}
                        onChange={() => toggle(group.key, o.value)}
                      />
                      <span>{o.label}</span>
                      <span className="text-gray-500 text-xs">({counts[group.key][o.value]})</span>
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
