// Lógica de filtrado de conjuros.
// Cada campo del conjuro se traduce a una o varias "etiquetas" (facetas). Dentro de un
// mismo grupo de filtro se cumple si el conjuro tiene ALGUNA de las etiquetas marcadas
// (o TODAS, en los grupos que permiten elegir ese modo); entre grupos se exige cumplir todos.

const opt = (value, label) => ({ value, label });

export const FILTER_GROUPS = [
  {
    key: 'nivel',
    label: 'Nivel',
    options: [
      opt('0', 'Trucos'),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => opt(String(n), `Nivel ${n}`)),
    ],
  },
  {
    key: 'clase',
    label: 'Clase',
    modes: true,
    options: ['Bardo', 'Brujo', 'Clérigo', 'Druida', 'Explorador', 'Hechicero', 'Mago', 'Paladín'].map(c => opt(c, c)),
  },
  {
    key: 'escuela',
    label: 'Escuela',
    options: ['Abjuración', 'Adivinación', 'Conjuración', 'Encantamiento', 'Evocación', 'Ilusión', 'Nigromancia', 'Transmutación'].map(c => opt(c, c)),
  },
  {
    key: 'componentes',
    label: 'Componentes',
    modes: true,
    options: [opt('V', 'Verbal (V)'), opt('S', 'Somático (S)'), opt('M', 'Material (M)')],
  },
  {
    key: 'tiempo',
    label: 'Tiempo de lanzamiento',
    options: [
      opt('accion', '1 acción'), opt('adicional', '1 acción adicional'), opt('reaccion', '1 reacción'),
      opt('1min', '1 minuto'), opt('10min', '10 minutos'), opt('1h', '1 hora'), opt('8h', '8 horas o más'),
      opt('ritual', 'Ritual'),
    ],
  },
  {
    key: 'alcance',
    label: 'Alcance',
    options: [
      opt('lanzador', 'Lanzador'), opt('toque', 'Toque'), opt('cerca', '5 a 30 pies (1,5 a 9 m)'), opt('60', '60 pies (18 m)'),
      opt('medio', '90 a 150 pies (27 a 45 m)'), opt('lejos', '300 pies o más (90 m o más)'), opt('otros', 'Vista, ilimitado o especial'),
    ],
  },
  {
    key: 'duracion',
    label: 'Duración',
    options: [
      opt('instantaneo', 'Instantáneo'), opt('concentracion', 'Concentración'), opt('hasta1min', 'Hasta 1 minuto'),
      opt('hasta1h', '10 minutos a 1 hora'), opt('8h', '8 horas o más'), opt('disipado', 'Hasta que sea disipado'),
      opt('especial', 'Especial'),
    ],
  },
  {
    key: 'ataque',
    label: 'Ataque',
    options: [
      opt('cac', 'Cuerpo a cuerpo'), opt('distancia', 'A distancia'), opt('salvacion', 'Contra salvación'),
      opt('ninguno', 'Sin ataque'),
    ],
  },
];

const stripRitual = s => (s || '').replace(/\s*\(ritual\)/i, '').trim();
const isRitual = s => /\britual\b/i.test(s || '');

const facetFns = {
  nivel: (c, nivel) => [String(nivel)],
  clase: c => (c.clases || '').split(/,| y /).map(s => s.trim()).filter(Boolean),
  escuela: c => [stripRitual(c.escuela)],
  componentes: c => (c.componentes || '').replace(/\(.*$/s, '').split(/[\s,;.]+/).filter(t => ['V', 'S', 'M'].includes(t)),
  tiempo: c => {
    const raw = c.tiempoDeLanzamiento || '';
    const t = stripRitual(raw);
    const out = [];
    if (/^(1 )?acción adicional/i.test(t)) out.push('adicional');
    else if (/^(1 )?acción( \([^)]*\))? u /i.test(t)) out.push('accion', '8h');
    else if (/^(1 )?acción/i.test(t)) out.push('accion');
    else if (/^(1 )?reacción/i.test(t)) out.push('reaccion');
    else if (/^1 minuto/i.test(t)) out.push('1min');
    else if (/^10 minutos/i.test(t)) out.push('10min');
    else if (/^1 hora/i.test(t)) out.push('1h');
    else if (/^\d+ horas/i.test(t)) out.push('8h');
    if (isRitual(raw) || isRitual(c.escuela)) out.push('ritual');
    return out;
  },
  alcance: c => {
    const a = (c.alcance || '').replace(/\s*\(.*\)/, '').trim();
    if (/^Lanzador/i.test(a)) return ['lanzador'];
    if (/^Toque/i.test(a)) return ['toque'];
    const m = a.match(/^(\d+(?:,\d+)?)\s*(pies|millas?|km|m)\b/i);
    if (!m) return ['otros'];
    let n = parseFloat(m[1].replace(',', '.'));
    const unit = m[2].toLowerCase();
    if (unit.startsWith('milla') || unit === 'km') return ['lejos'];
    if (unit === 'm') n = Math.round(n / 0.3);
    if (n <= 30) return ['cerca'];
    if (n === 60) return ['60'];
    if (n <= 150) return ['medio'];
    return ['lejos'];
  },
  duracion: c => {
    const d = c.duracion || '';
    const out = [];
    if (/^Instantáneo/i.test(d)) return ['instantaneo'];
    if (/^Especial/i.test(d)) return ['especial'];
    if (/disipado/i.test(d)) return ['disipado'];
    if (/^Concentración/i.test(d)) out.push('concentracion');
    const m = d.match(/(\d+)\s*(asaltos?|minutos?|horas?|días?)/i);
    if (m) {
      const n = +m[1], u = m[2].toLowerCase();
      if (u.startsWith('asalto') || (u.startsWith('minuto') && n <= 1)) out.push('hasta1min');
      else if (u.startsWith('minuto') || (u.startsWith('hora') && n <= 1)) out.push('hasta1h');
      else out.push('8h');
    }
    return out;
  },
  ataque: c => {
    const a = (c.ataque || '').trim();
    if (/^cuerpo a cuerpo o a distancia/i.test(a)) return ['cac', 'distancia'];
    if (/^cuerpo a cuerpo/i.test(a)) return ['cac'];
    if (/^a distancia/i.test(a)) return ['distancia'];
    if (/salvaci/i.test(a)) return ['salvacion'];
    return ['ninguno'];
  },
};

export function buildFacets(conjuro, nivel) {
  const f = {};
  for (const g of FILTER_GROUPS) f[g.key] = facetFns[g.key](conjuro, nivel);
  return f;
}

export function emptyFilters() {
  const f = { modes: {} };
  for (const g of FILTER_GROUPS) { f[g.key] = []; if (g.modes) f.modes[g.key] = 'any'; }
  return f;
}

export const countActive = filters => FILTER_GROUPS.reduce((n, g) => n + filters[g.key].length, 0);

export function matches(facets, filters) {
  for (const g of FILTER_GROUPS) {
    const sel = filters[g.key];
    if (!sel.length) continue;
    const have = facets[g.key];
    const ok = g.modes && filters.modes[g.key] === 'all' ? sel.every(v => have.includes(v)) : sel.some(v => have.includes(v));
    if (!ok) return false;
  }
  return true;
}

// Cuántos conjuros tienen cada opción (para mostrarlo junto a la casilla).
export function countOptions(facetsList) {
  const counts = {};
  for (const g of FILTER_GROUPS) { counts[g.key] = {}; for (const o of g.options) counts[g.key][o.value] = 0; }
  for (const f of facetsList) for (const g of FILTER_GROUPS) for (const v of new Set(f[g.key])) if (v in counts[g.key]) counts[g.key][v]++;
  return counts;
}
