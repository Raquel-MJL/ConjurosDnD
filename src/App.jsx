import { useEffect, useMemo, useState } from 'react';
import './App.css';
import React from 'react';
import {Section} from './sections/section';
import {Filters} from './components/filters/filters';
import {ActiveFilters} from './components/filters/activeFilters';
import {Search} from './components/search/search';
import {EditionToggle} from './components/edition/edition';
import {Hechizos} from './data/sectionData';
import {Hechizos2024} from './data/sectionData2024';
import {buildFacets, countActive, countOptions, emptyFilters, matches, matchesSearch, searchTerms, searchTextOf} from './lib/filters';
import {linkFor, parseLink, slugOf} from './lib/links';

// Ediciones del Manual del Jugador disponibles.
const EDITIONS = [
  { id: '2014', label: 'Manual 2014', data: Hechizos },
  { id: '2024', label: 'Manual 2024', data: Hechizos2024 },
];
const STORAGE_KEY = 'edicionConjuros';

// Etiquetas de cada conjuro (nivel, clase, escuela...), su texto de búsqueda, sus identificadores de enlace y recuentos por opción, calculados una sola vez por edición.
const prepared = Object.fromEntries(EDITIONS.map(({ id, data }) => {
  const facetsOf = new Map();
  const textOf = new Map();
  data.forEach((section, nivel) => section.conjuros.forEach(c => {
    facetsOf.set(c, buildFacets(c, nivel));
    textOf.set(c, searchTextOf(c));
  }));
  const slugs = new Set([...facetsOf.keys()].map(c => slugOf(c.texto)));
  return [id, { data, facetsOf, textOf, slugs, optionCounts: countOptions([...facetsOf.values()]), total: facetsOf.size }];
}));

// Enlace del navegador (#/2024/agarre-electrizante) si apunta a un conjuro que existe.
const readLink = () => {
  const link = parseLink();
  return link && prepared[link.edition]?.slugs.has(link.slug) ? link : null;
};

const initialEdition = () => {
  const linked = readLink();
  if (linked) return linked.edition;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved in prepared) return saved;
  } catch { /* sin almacenamiento disponible: se usa la edición por defecto */ }
  return EDITIONS[0].id;
};

function App() {
  const [edition, setEdition] = useState(initialEdition);
  const [filters, setFilters] = useState(emptyFilters);
  const [query, setQuery] = useState('');
  const [openSlug, setOpenSlug] = useState(() => readLink()?.slug ?? null); // conjuro abierto en el modal
  const { data, facetsOf, textOf, optionCounts, total } = prepared[edition];
  const terms = useMemo(() => searchTerms(query), [query]);
  const filtering = countActive(filters) > 0 || terms.length > 0;

  useEffect(() => {
    document.documentElement.dataset.edition = edition; // el CSS tiñe el fondo según la edición
    try { localStorage.setItem(STORAGE_KEY, edition); } catch { /* sin almacenamiento disponible */ }
  }, [edition]);

  // Atrás/adelante del navegador y enlaces pegados con la página ya abierta: abren o cierran el conjuro indicado.
  useEffect(() => {
    const onPop = () => {
      const link = readLink();
      setOpenSlug(link ? link.slug : null);
      if (link) { setEdition(link.edition); setFilters(emptyFilters()); setQuery(''); } // que ningún filtro oculte el conjuro enlazado
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openSpell = slug => {
    window.history.pushState({ spell: true }, '', linkFor(edition, slug));
    setOpenSlug(slug);
  };
  const closeSpell = () => {
    if (window.history.state?.spell) { window.history.back(); return; } // deshace la entrada que añadió openSpell
    window.history.replaceState(null, '', window.location.pathname + window.location.search); // se llegó por enlace directo
    setOpenSlug(null);
  };

  const sections = useMemo(
    () => data.map(s => ({
      ...s,
      conjuros: s.conjuros.filter(c => matchesSearch(textOf.get(c), terms) && matches(facetsOf.get(c), filters)),
    })),
    [data, facetsOf, textOf, filters, terms]
  );
  const shown = sections.reduce((n, s) => n + s.conjuros.length, 0);
  const visible = filtering ? sections.filter(s => s.conjuros.length > 0) : sections;

  return (
    <>
      <div className="mx-auto px-4 py-8">
        <h1 className="webTitle text-center mb-5">Conjuros D&D</h1>

        <EditionToggle editions={EDITIONS} value={edition} onChange={setEdition} />

        <Search value={query} onChange={setQuery} />

        <Filters
          filters={filters}
          onChange={setFilters}
          counts={optionCounts}
          total={total}
          shown={shown}
        />
        <ActiveFilters filters={filters} onChange={setFilters} />

        <div className="mx-auto">
          {filtering && shown === 0 && (
            <p className="text-center italic my-8">Ningún conjuro coincide con la búsqueda y los filtros marcados.</p>
          )}
          {visible.map((sectionData) => (
            <Section
              key={`${edition}-${sectionData.id}`}
              title={sectionData.nivel}
              conjuros={sectionData.conjuros}
              backgroundColor={sectionData.backgroundColor}
              openSlug={openSlug}
              onOpenSpell={openSpell}
              onCloseSpell={closeSpell}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default App
