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
