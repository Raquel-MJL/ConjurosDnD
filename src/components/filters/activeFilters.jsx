import React from 'react';
import { FILTER_GROUPS } from '../../lib/filters';

// Globitos flotantes (solo en pantallas anchas) con cada filtro marcado; la ✕ lo desmarca.
const ActiveFilters = ({ filters, onChange }) => {
  const chips = FILTER_GROUPS.flatMap(group =>
    filters[group.key].map(value => ({
      key: `${group.key}-${value}`,
      group,
      value,
      label: group.options.find(o => o.value === value)?.label ?? value,
    }))
  );
  if (chips.length === 0) return null;

  const remove = ({ group, value }) => onChange({ ...filters, [group.key]: filters[group.key].filter(v => v !== value) });

  return (
    <ul className="active-filters" aria-label="Filtros marcados">
      {chips.map(chip => (
        <li key={chip.key} className="active-chip">
          <span className="active-chip-text">
            <span className="active-chip-group">{chip.group.label}</span>
            <span className="active-chip-value">{chip.label}</span>
          </span>
          <button
            type="button"
            className="active-chip-close border-0"
            onClick={() => remove(chip)}
            aria-label={`Quitar filtro ${chip.group.label}: ${chip.label}`}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
};

export { ActiveFilters };
