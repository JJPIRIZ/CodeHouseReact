// src/utils/images.js
import { slugify, removeDiacritics } from "./strings";

export const BASE = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "/");

// Dónde vive /images en tu hosting (para archivos subidos por FTP/PHP)
const PUBLIC_IMAGES_BASE = (() => {
  let b = (import.meta.env.VITE_PUBLIC_IMAGES_BASE || "").trim();
  if (!b || !/^https?:\/\//i.test(b)) return "";
  if (!b.endsWith("/")) b += "/";
  return b; // ej: https://jjpiriz.com.ar/MasTecno/images/
})();

export function toPublicImage(u) {
  if (!u) return "";
  const s = String(u).trim();

  // URL absoluta (https://...) → usar tal cual
  if (/^https?:\/\//i.test(s)) return s;

  // /images/xx → colgar de BASE
  if (s.startsWith("/")) return `${BASE.replace(/\/$/, "")}${s}`;

  // images/xx → colgar de BASE
  if (s.startsWith("images/")) return `${BASE}${s}`;

  // archivo suelto (xx.ext) → preferir dominio público si está
  if (/^[a-z0-9_\-]+\.(png|jpg|jpeg|webp|avif)$/i.test(s)) {
    if (PUBLIC_IMAGES_BASE) return `${PUBLIC_IMAGES_BASE}${s}`;
    return `${BASE}images/${s}`;
  }

  // fallback
  const clean = s.replace(/^public\//i, "");
  const path = clean.startsWith("images/") ? clean : `images/${clean}`;
  return `${BASE}${path}`;
}

export function buildNameVariants(nombre) {
  const raw = String(nombre ?? "").trim();
  const noAccent = removeDiacritics(raw);
  const lower = noAccent.toLowerCase();
  const hyphen = lower.replace(/\s+/g, "-");
  const slug = slugify(raw);
  return Array.from(new Set([raw, noAccent, lower, hyphen, slug])).filter(Boolean);
}

/**
 * Genera candidatos de imagen a partir del nombre (y su slug).
 * Prioriza buscar en VITE_PUBLIC_IMAGES_BASE y luego en BASE.
 */
export function buildImageCandidates({ nombre, exts = ["webp","jpg","jpeg","png","avif"] }) {
  const prefixes = [];
  if (PUBLIC_IMAGES_BASE) prefixes.push(PUBLIC_IMAGES_BASE);   // https://.../images/
  prefixes.push(`${BASE}images/`);                             // /MasTecno/images/ (dev y build)

  const list = [];
  for (const n of buildNameVariants(nombre)) {
    for (const ext of exts) {
      for (const p of prefixes) list.push(`${p}${n}.${ext}`);
    }
  }
  // También intentamos por ID directo (un slug), si viene ya slugificado desde otro lado
  const slug = slugify(String(nombre ?? ""));
  if (slug) {
    for (const ext of exts) {
      for (const p of prefixes) list.push(`${p}${slug}.${ext}`);
    }
  }
  return Array.from(new Set(list));
}
