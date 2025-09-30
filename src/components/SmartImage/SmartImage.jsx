import { useMemo, useState, useEffect } from "react";

function normalizeBaseName(nameRaw) {
  const name = String(nameRaw ?? "").trim();
  if (!name) return [];
  const noDiacritics = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const variants = new Set([
    name,                                   // original (con comas y espacios)
    noDiacritics,                           // sin acentos
    noDiacritics.replace(/,/g, " "),        // comas → espacio
    noDiacritics.replace(/,/g, ""),         // sin comas
    noDiacritics.replace(/[,\s]+/g, "-"),   // espacios/comas → guiones
    noDiacritics.replace(/[,\s]+/g, "_"),   // espacios/comas → guiones bajos
    noDiacritics.toLowerCase(),
    noDiacritics.toLowerCase().replace(/,/g, ""),
    noDiacritics.toLowerCase().replace(/[,\s]+/g, "-"),
  ]);

  return Array.from(variants).filter(Boolean);
}

/**
 * SmartImage: intenta múltiples rutas hasta que una carga.
 * - src: URL directa (si viene del sheet)
 * - names: nombres base (ej. [title])
 * - basePath: prefijo (por defecto /MasTecno/images/)
 * - exts: prioridades de extensión a probar
 */
export default function SmartImage({
  src,
  names = [],
  basePath = `${import.meta.env.BASE_URL}images/`,
  exts = ["jpg", "png", "jpeg", "webp", "avif"],
  alt = "",
  className = "",
  ...imgProps
}) {
  const candidates = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1) fuente directa (del sheet)
    if (src && String(src).trim()) {
      const direct = String(src).trim();
      if (!seen.has(direct)) { seen.add(direct); list.push(direct); }
    }

    // 2) variantes por cada nombre
    for (const raw of names) {
      const bases = normalizeBaseName(raw);
      for (const base of bases) {
        for (const ext of exts) {
          const unencoded = `${basePath}${base}.${ext}`;
          const encoded   = `${basePath}${encodeURIComponent(base)}.${ext}`;
          if (!seen.has(unencoded)) { seen.add(unencoded); list.push(unencoded); }
          if (!seen.has(encoded))   { seen.add(encoded);   list.push(encoded); }
        }
      }
    }

    return list;
  }, [src, names, basePath, exts]);

  const [idx, setIdx] = useState(0);
  const current = candidates[idx] || "";

  useEffect(() => { setIdx(0); }, [candidates.join("|")]);

  if (!current) {
    return (
      <div
        className={`bg-light d-flex align-items-center justify-content-center ${className}`}
        style={{ aspectRatio: "4 / 3", borderRadius: "0.5rem" }}
      >
        <span className="text-secondary small">Sin imagen</span>
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => setIdx(i => (i + 1 < candidates.length ? i + 1 : i))}
      {...imgProps}
    />
  );
}
