// Extrae los conjuros del Manual del Jugador 2024 (PDF) y genera src/data/sectionData2024.js.
// Uso: node scripts/extract2024.mjs   (necesita pdftotext en el PATH y el PDF en la raíz del proyecto)
//
// El PDF tiene una capa de texto por OCR, así que el resultado puede arrastrar erratas del PDF.
// Los conjuros cuyo texto sale demasiado roto se corrigen a mano en OVERRIDES.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { Hechizos } from '../src/data/sectionData.js';

const PDF = 'D&D - 5.5 - Manual del Jugador 2024 - Español (1).pdf';
const FIRST = 241, LAST = 345; // páginas del PDF con las descripciones de conjuros

const norm = s => s.toLowerCase().replace(/^(el|la|los|las) /, '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// Iconos: se reutilizan los de la versión 2014 cuando el conjuro tiene el mismo nombre.
const iconos = new Map();
Hechizos.forEach(s => s.conjuros.forEach(c => c.icono && iconos.set(norm(c.texto), c.icono)));

// Conjuros nuevos o renombrados en 2024: su icono está en public/assets/<carpeta>/<nombreEnCamelCase>.svg
const camel = n => norm(n).split(' ').map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join('');
const iconoPropio = (texto, nivel) => {
  const ruta = `assets/${nivel === 0 ? 'cantrip' : 'nivel' + nivel}/${camel(texto)}.svg`;
  return existsSync(new URL(`../public/${ruta}`, import.meta.url)) ? `../${ruta}` : undefined;
};

// ---------- 1. Texto del PDF en orden de lectura (columna izquierda y luego derecha) ----------
function pageColumns(p) {
  const raw = execFileSync('pdftotext', ['-enc', 'UTF-8', '-f', String(p), '-l', String(p), '-layout', PDF, '-'], { maxBuffer: 1 << 26 }).toString('utf8');
  const lines = raw.replace(/\f/g, '').split('\n');
  // Canal entre columnas: la franja central (columnas 50-75) con menos texto; se corta por su mitad.
  const ink = [];
  for (let c = 50; c <= 75; c++) ink[c] = lines.filter(l => l[c] && l[c] !== ' ').length;
  const min = Math.min(...ink.slice(50));
  let cut = 62, bestLen = 0;
  for (let c = 50; c <= 75; c++) {
    if (ink[c] !== min) continue;
    let e = c;
    while (e + 1 <= 75 && ink[e + 1] === min) e++;
    if (e - c + 1 > bestLen) { bestLen = e - c + 1; cut = Math.floor((c + e) / 2); }
    c = e;
  }
  const left = [], right = [];
  for (const l of lines) {
    left.push(l.slice(0, cut).trimEnd());
    right.push(l.length > cut ? l.slice(cut).trimEnd() : '');
  }
  // Cada columna se "desangra" a su margen más frecuente, para que la sangría de párrafo sea comparable.
  const dedent = col => {
    const counts = new Map();
    for (const l of col) if (l.trim()) { const n = l.match(/^\s*/)[0].length; counts.set(n, (counts.get(n) || 0) + 1); }
    const base = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
    return col.map(l => (l.trim() ? ' '.repeat(Math.max(0, l.match(/^\s*/)[0].length - base)) + l.trim() : ''));
  };
  return [...dedent(left), ...dedent(right)];
}

let lines = [];
for (let p = FIRST; p <= LAST; p++) lines.push(...pageColumns(p));

// ---------- 2. Limpieza de cabeceras, pies de página y restos de ilustraciones ----------
const isJunk = t =>
  /CAPÍTULO 7 \| CONJUROS/.test(t) || /^\d{1,3}$/.test(t) || /^DESCRIPCIONES DE CONJUROS$/.test(t) ||
  /^Los conjuros se presentan en orden alfabético\.?$/.test(t) || /^[|\]\[)(.\-_—•\s]+$/.test(t);
lines = lines.map(l => l.replace(/\s+$/, '').replace(/\s+[|\]]$/, '')).filter(l => !isJunk(l.trim()));

// ---------- 3. Segmentación en conjuros ----------
// Un conjuro empieza en su línea de nivel/escuela ("Evocación de nivel 3 (mago)" / "Truco de evocación (mago)");
// su nombre es la línea anterior, esté escrita en mayúsculas o no. El OCR a veces pierde el espacio ("nivel1").
const LEVEL_START = /^(?:Truco de [a-záéíóúñ]+|[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ de ?nivel ?\d)\s*\(/;
const LEVEL = /^(?:Truco de ([a-záéíóúñ]+)|([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+) de ?nivel ?(\d))\s*\(([^)]*)\)/;

// La lista de clases puede partirse en dos líneas: se unen antes de segmentar.
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  if (LEVEL_START.test(t) && !t.includes(')')) {
    let n = i + 1;
    while (n < lines.length && !lines[n].trim()) n++;
    lines[i] = t + ' ' + lines[n].trim();
    lines.splice(i + 1, n - i);
  }
}

const spells = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].trim().match(LEVEL);
  if (!m) continue;
  let h = i - 1;
  while (h >= 0 && !lines[h].trim()) h--;
  let name = lines[h].trim();
  // Nombres partidos en dos líneas ("SANCTASANCTÓRUM PRIVADO" / "DE MORDENKAINEN").
  let top = h;
  while (top > 0 && lines[top - 1].trim() && /^[“"]?[A-ZÁÉÍÓÚÑ ]{4,}$/.test(lines[top - 1].trim())) { top--; name = lines[top].trim() + ' ' + name; }
  spells.push({ name: name.replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ]+/, ''), head: top, start: i, levelMatch: m });
}
spells.forEach((s, k) => { s.end = k + 1 < spells.length ? spells[k + 1].head : lines.length; });

// ---------- 4. Datos de cada conjuro ----------
const ESCUELAS = { hlus: 'Ilusión', abju: 'Abjuración', adiv: 'Adivinación', conj: 'Conjuración', enca: 'Encantamiento', evoc: 'Evocación', ilus: 'Ilusión', nigr: 'Nigromancia', tran: 'Transmutación' };
const CLASES = ['bardo', 'brujo', 'clérigo', 'druida', 'explorador', 'hechicero', 'mago', 'paladín'];
const PROPIOS = ['Tasha', 'Mordenkainen', 'Bigby', 'Otto', 'Tenser', 'Melf', 'Nystul', 'Leomund', 'Evard', 'Otiluke', 'Rary', 'Drawmij', 'Snilloc', 'Hadar', 'Agathys', 'Abi-Dalzim', 'Aganazzar', 'Vitriólico', 'Cordón', 'Faerie', 'Yolande', 'Jallarzi'];

const nombre = raw => {
  let n = cap(raw.toLowerCase());
  for (const p of PROPIOS) n = n.replace(new RegExp(`\\b${p.toLowerCase()}\\b`, 'g'), p);
  return n;
};
const listaClases = raw => {
  const cs = raw.split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  const ok = cs.filter(c => CLASES.includes(c));
  if (ok.length !== cs.length) console.warn('clases raras:', raw);
  const names = ok.map(cap);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}` : names[0] || '';
};

const LABELS = /(Tiempo de lanza[^\s:]*|Alcance|Componentes|Duraci[oó]n)\s*:/g;
const clean = s => s.replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1')
  .replace(/(\d) mo /g, '$1 m o ').replace(/adicionál/g, 'adicional').trim().replace(/\s*[|*]$/, '');
const limpiaAlcance = a => a.replace(/^(\d+(?:,\d+)? (?:m|km)) \d$/, '$1').replace(/^(\d+)m$/, '$1 m').replace(/^limitado$/, 'Ilimitado');
const NOMBRES = { ESCUPO: 'ESCUDO', 'LEVITAR DE': 'LEVITAR' }; // erratas del OCR en el nombre

// Correcciones manuales para conjuros con el texto de la cabecera o de la descripción destrozado por el OCR.
const OVERRIDES = {
  'CASTIGO ATRONADOR': { tiempo: 'Acción adicional, que realizas de inmediato tras acertar a una criatura con un arma cuerpo a cuerpo o un ataque sin armas' },
  'CASTIGO ABRUMADOR': { tiempo: 'Acción adicional, que realizas de inmediato tras acertar a una criatura con un arma cuerpo a cuerpo o un ataque sin armas', alcance: 'Lanzador' },
  'ROCIADA VENENOSA': {
    tiempo: 'Acción', alcance: '9 m', componentes: 'V, S', duracion: 'Instantáneo',
    info: 'Rocías a una criatura dentro del alcance con una niebla tóxica. Haz un ataque de conjuro a distancia contra el objetivo. Si aciertas, el objetivo recibirá 1d12 de daño de veneno.*Mejora de truco. El daño aumenta en 1d12 cuando alcanzas los niveles 5 (2d12), 11 (3d12) y 17 (4d12).',
  },
};

// Párrafos: una línea con más sangría que el resto, o un encabezado fijo, abre un párrafo nuevo.
const RUNIN = /^(Mejora de truco|Con un espacio de conjuro de nivel superior)\./;
// Pies de ilustración y restos del OCR: líneas en mayúsculas, con varias palabras en mayúsculas o muy cortas sin puntuación.
const isCaption = t =>
  (t.length >= 4 && t === t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{3}/.test(t)) ||
  (t.match(/\b[A-ZÁÉÍÓÚÑ]{3,}\b/g) || []).length >= 3 ||
  (t.length <= 3 && !/[.,;:)\d]/.test(t));
// Perfiles de criatura (invocaciones): el OCR de las tablas es ilegible, así que se descartan esos párrafos.
const isStatBlock = p => /\bCA: ?\d|\bPG: ?\d|\bVD: |Percepción pasiva \d|Fue ?\d{1,2}\s*[+-]/.test(p);

// Restos sueltos de pies de ilustración que el OCR ha colado en el texto.
const RESIDUOS = /Cucmitto |EsPÍRITU CELE|\s+o\s+\)\]|\s+mE\b/g;

function parse(sp) {
  const body = lines.slice(sp.start, sp.end);
  const first = body[0].trim();
  const lm = sp.levelMatch;
  const nivel = lm[1] ? 0 : Number(lm[3]);
  const escuelaRaw = (lm[1] || lm[2]).toLowerCase();
  const escuela = ESCUELAS[escuelaRaw.slice(0, 4)] || cap(escuelaRaw);

  // Bloque de datos: hasta la línea de "Duración:".
  let k = body.findIndex(l => /Duraci[oó]n\s*:/.test(l));
  if (k < 0 || k > 12) k = 0;
  const headerText = [first.slice(lm[0].length), ...body.slice(1, k + 1)].join('\n');
  const fields = {};
  const marks = [...headerText.matchAll(LABELS)];
  marks.forEach((m, i) => {
    const key = m[1].startsWith('Tiempo') ? 'tiempo' : m[1].startsWith('Alcance') ? 'alcance' : m[1].startsWith('Comp') ? 'componentes' : 'duracion';
    const end = i + 1 < marks.length ? marks[i + 1].index : headerText.length;
    fields[key] = clean(headerText.slice(m.index + m[0].length, end));
  });
  if (fields.alcance) fields.alcance = limpiaAlcance(fields.alcance);
  Object.assign(fields, OVERRIDES[sp.name] || {});

  // Descripción.
  const rest = body.slice(k + 1).filter(l => l.trim() && !isCaption(l.trim()));
  const indents = rest.map(l => l.match(/^\s*/)[0].length);
  const base = 0;
  const paras = [];
  let cur = '';
  const push = () => { if (cur.trim()) paras.push(cur.trim()); cur = ''; };
  rest.forEach((l, i) => {
    const t = l.trim();
    // Un párrafo nuevo solo puede empezar tras una frase completa (evita cortes falsos por la maquetación).
    const closed = /[.:;!?)”"»]$/.test(cur);
    if ((indents[i] >= base + 2 && closed) || (RUNIN.test(t) && cur)) push();
    cur += (cur && !cur.endsWith('-') ? ' ' : '') + t;
  });
  push();
  const kept = paras.filter(p => !isStatBlock(p)).map(p => p.replace(/\s*\|+\]?\s*/g, ' ').trim());
  if (kept.length < paras.length) kept.push('El perfil de la criatura invocada se encuentra en el Manual del Jugador 2024.');
  const info = (fields.info ?? kept.join('*')).replace(RESIDUOS, '').replace(/ {2,}/g, ' ');

  return { name: sp.name, nivel, escuela, clases: lm[4], fields, info };
}

// Tipo de ataque, a partir del texto (el manual de 2024 ya no lo pone en la cabecera).
function ataqueDe(info) {
  const m = info.match(/ataque de conjuro (cuerpo a cuerpo o a distancia|cuerpo a cuerpo|a distancia)/i);
  if (m) return cap(m[1]);
  if (/tirada de salvación/i.test(info)) return 'Contra salvación';
  return '--';
}

const byLevel = Array.from({ length: 10 }, () => []);
const problemas = [];
for (const sp of spells) {
  const p = parse(sp);
  const f = p.fields;
  if (!f.tiempo || !f.alcance || !f.componentes || !f.duracion) problemas.push(p.name);
  byLevel[p.nivel].push({
    icono: iconos.get(norm(NOMBRES[p.name.toUpperCase()] || p.name)) || iconoPropio(nombre(NOMBRES[p.name.toUpperCase()] || p.name), p.nivel),
    texto: nombre(NOMBRES[p.name.toUpperCase()] || p.name),
    escuela: p.escuela,
    componentes: f.componentes,
    tiempoDeLanzamiento: f.tiempo,
    alcance: f.alcance,
    duracion: f.duracion,
    ataque: ataqueDe(p.info),
    clases: listaClases(p.clases),
    informacion: p.info,
  });
}

// ---------- 5. Salida ----------
const q = JSON.stringify;
let out = '// Generado con scripts/extract2024.mjs a partir del Manual del Jugador 2024.\nexport const Hechizos2024 = [\n';
Hechizos.forEach((s, nivel) => {
  out += `    {\n        id: ${s.id},\n        nivel: ${q(s.nivel)},\n        backgroundColor: ${q(s.backgroundColor)},\n        conjuros: [\n`;
  byLevel[nivel].sort((a, b) => a.texto.localeCompare(b.texto, 'es')).forEach(c => {
    out += '            {\n';
    for (const [k, v] of Object.entries(c)) if (v !== undefined) out += `                ${k}: ${q(v)},\n`;
    out += '            },\n';
  });
  out += '        ]\n    },\n';
});
out += '];\n';
writeFileSync(new URL('../src/data/sectionData2024.js', import.meta.url), out);

console.log('conjuros:', spells.length, '→', byLevel.map(l => l.length).join(' / '));
if (problemas.length) console.log('sin algún dato de cabecera:', problemas);
