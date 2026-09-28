import { useEffect, useMemo, useState } from 'react';
import './App.css';
import React from 'react';
import {Section} from './sections/section';
import {Filters} from './components/filters/filters';
import {EditionToggle} from './components/edition/edition';
import {Hechizos} from './data/sectionData';
import {Hechizos2024} from './data/sectionData2024';
import {buildFacets, countActive, countOptions, emptyFilters, matches} from './lib/filters';

// Ediciones del Manual del Jugador disponibles.
const EDITIONS = [
  { id: '2014', label: 'Manual 2014', data: Hechizos },
  { id: '2024', label: 'Manual 2024', data: Hechizos2024 },
];
const STORAGE_KEY = 'edicionConjuros';

// Etiquetas de cada conjuro (nivel, clase, escuela...) y recuentos por opción, calculados una sola vez por edición.
const prepared = Object.fromEntries(EDITIONS.map(({ id, data }) => {
  const facetsOf = new Map();
  data.forEach((section, nivel) => section.conjuros.forEach(c => facetsOf.set(c, buildFacets(c, nivel))));
  return [id, { data, facetsOf, optionCounts: countOptions([...facetsOf.values()]), total: facetsOf.size }];
}));

const initialEdition = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved in prepared) return saved;
  } catch { /* sin almacenamiento disponible: se usa la edición por defecto */ }
  return EDITIONS[0].id;
};

function App() {
  const [edition, setEdition] = useState(initialEdition);
  const [filters, setFilters] = useState(emptyFilters);
  const { data, facetsOf, optionCounts, total } = prepared[edition];
  const filtering = countActive(filters) > 0;

  useEffect(() => {
    document.documentElement.dataset.edition = edition; // el CSS tiñe el fondo según la edición
    try { localStorage.setItem(STORAGE_KEY, edition); } catch { /* sin almacenamiento disponible */ }
  }, [edition]);

  const sections = useMemo(
    () => data.map(s => ({ ...s, conjuros: s.conjuros.filter(c => matches(facetsOf.get(c), filters)) })),
    [data, facetsOf, filters]
  );
  const shown = sections.reduce((n, s) => n + s.conjuros.length, 0);
  const visible = filtering ? sections.filter(s => s.conjuros.length > 0) : sections;

  return (
    <>
      <div className="mx-auto px-4 py-8">
        <h1 className="webTitle text-center mb-5">Conjuros D&D</h1>

        <EditionToggle editions={EDITIONS} value={edition} onChange={setEdition} />

        <Filters
          filters={filters}
          onChange={setFilters}
          counts={optionCounts}
          total={total}
          shown={shown}
        />

        <div className="mx-auto">
          {filtering && shown === 0 && (
            <p className="text-center italic my-8">Ningún conjuro cumple los filtros marcados.</p>
          )}
          {visible.map((sectionData) => (
            <Section
              key={`${edition}-${sectionData.id}`}
              title={sectionData.nivel}
              conjuros={sectionData.conjuros}
              backgroundColor={sectionData.backgroundColor}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default App
