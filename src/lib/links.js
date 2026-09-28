// Enlaces directos a un conjuro: #/<edición>/<nombre-del-conjuro>, p. ej. #/2024/agarre-electrizante.

export const slugOf = texto => texto
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const linkFor = (edition, slug) => `#/${edition}/${slug}`;

// Lee el enlace actual; devuelve { edition, slug } o null si no hay ninguno (la validez la comprueba quien llama).
export function parseLink() {
  const m = window.location.hash.match(/^#\/(\d+)\/([^/]+)$/);
  if (!m) return null;
  try { return { edition: m[1], slug: decodeURIComponent(m[2]) }; } catch { return null; }
}

// Los iconos de los datos se escriben como "../assets/nivel1/x.svg"; se resuelven contra la base de la app
// para que sigan funcionando si se publica en una subcarpeta.
export const iconUrl = icono => `${import.meta.env.BASE_URL}${icono.replace(/^\.\.\//, '')}`;
