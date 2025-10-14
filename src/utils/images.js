// src/utils/images.js
import { slugify, removeDiacritics } from "./strings";

export const BASE = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "/");

export function toPublicImage(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${BASE.replace(/\/$/, "")}${s}`;
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

export function buildImageCandidates({ imagenRaw, nombre, exts = ["webp","jpg","jpeg","png","avif"] }) {
  const list = [];
  if (imagenRaw) list.push(toPublicImage(imagenRaw));
  for (const n of buildNameVariants(nombre)) {
    for (const ext of exts) list.push(`${BASE}images/${n}.${ext}`);
  }
  return Array.from(new Set(list));
}

/** NUEVO: primera opción estricta por id -> /images/<id>.jpg */
export function imageForProduct(p) {
  const id = String(p?.id || "").trim();
  const nombre = p?.nombre || p?.title || "";
  const imagenRaw = p?.imagenRaw || p?.image || "";
  const candidates = [];

  if (id) {
    // Convención de subida: .jpg primero
    candidates.push(`${BASE}images/${id}.jpg`);
    // Por compatibilidad, probamos otras extensiones si no estuviera el .jpg
    for (const ext of ["webp","png","jpeg"]) {
      candidates.push(`${BASE}images/${id}.${ext}`);
    }
  }

  candidates.push(...buildImageCandidates({ imagenRaw, nombre }));

  // devolvemos la primera; el <img> si falla mostrará fallback del componente
  return candidates[0] || "";
}

/** NUEVO: mapeo de nombres de colores comunes (es/en) a CSS */
export function colorNameToCss(name) {
  const s = removeDiacritics(String(name ?? "").trim().toLowerCase());
  const map = {
    blanco: "#ffffff",
    white: "#ffffff",
    negro: "#000000",
    black: "#000000",
    gris: "#808080",
    gray: "#808080",
    grisclaro: "#d3d3d3",
    plata: "#c0c0c0",
    silver: "#c0c0c0",
    rojo: "#ff0000",
    red: "#ff0000",
    rosado: "#ffc0cb",
    rosa: "#ffc0cb",
    pink: "#ffc0cb",
    bordo: "#800000",
    marron: "#8b4513",
    brown: "#8b4513",
    naranja: "#ffa500",
    orange: "#ffa500",
    amarillo: "#ffd700",
    gold: "#ffd700",
    verde: "#008000",
    green: "#008000",
    "verde claro": "#90ee90",
    verdeclaro: "#90ee90",
    celeste: "#00bfff",
    cyan: "#00ffff",
    turquesa: "#40e0d0",
    azul: "#0000ff",
    blue: "#0000ff",
    violeta: "#8a2be2",
    lila: "#c8a2c8",
    purpura: "#800080",
    beige: "#f5f5dc",
    dorado: "#daa520",
    fucsia: "#ff00ff",
    magenta: "#ff00ff",
  };
  return map[s] || null; // si no mapea, devolvemos null para pintar badge con borde
}
