// src/components/ItemCard/ItemCard.jsx
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProductHref } from "../../services/productsService";

// === Helpers (mismos que en ItemDetail) ===
const COLOR_MAP = {
  "blanco": "#ffffff", "negro": "#000000", "gris": "#808080", "beige": "#f5f5dc",
  "amarillo": "#ffd700", "naranja": "#ffa500", "rojo": "#ff3b30", "bordo": "#800000",
  "rosa": "#ffc0cb", "violeta": "#8a2be2", "lila": "#c8a2c8", "celeste": "#87ceeb",
  "azul": "#1e90ff", "azul oscuro": "#00008b", "verde": "#008000", "verde claro": "#90ee90",
};

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "/");

function parseColores(s) {
  if (!s) return [];
  return s
    .split(/,|\/|\|/g)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => ({ label: c, hex: COLOR_MAP[c.toLowerCase()] ?? "#999999" }));
}

function formatARS(n) {
  if (n == null) return "";
  try {
    return Number(n).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  } catch {
    return `$ ${n}`;
  }
}

function slugify(s) {
  return String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s.-]/g, "")
    .replace(/\s+/g, "-");
}
function buildNameVariants(nombre) {
  const raw = String(nombre ?? "").trim();
  const noAccent = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lower = noAccent.toLowerCase();
  return Array.from(new Set([
    raw, noAccent, lower,
    lower.replace(/\s+/g, "-"),
    slugify(raw),
  ])).filter(Boolean);
}
function toPublicImage(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${BASE.replace(/\/$/, "")}${s}`;
  const clean = s.replace(/^public\//i, "");
  const path = clean.startsWith("images/") ? clean : `images/${clean}`;
  return `${BASE}${path}`;
}
function buildImageCandidates({ imagenRaw, nombre }) {
  const list = [];
  if (imagenRaw) list.push(toPublicImage(imagenRaw));
  const exts = ["webp", "jpg", "jpeg", "png", "avif"];
  for (const n of buildNameVariants(nombre)) {
    for (const ext of exts) list.push(`${BASE}images/${n}.${ext}`);
  }
  return Array.from(new Set(list));
}

export default function ItemCard(props) {
  const p = props.item ?? props;

  const nombre =
    p?.nombre ?? p?._1 ?? p?.Producto ?? p?.producto ?? "Producto sin nombre";
  const categoria = p?.categoria ?? p?.Categoria ?? "";
  const precio = p?.precio ?? p?._3 ?? p?.["Precio Unitario"] ?? null;
  const colores = p?.colores ?? p?.Color ?? p?.Colores ?? "";

  // Candidatos de imagen (igual que en ItemDetail)
  const imagenRaw = (p?.imagen ?? p?.Imagen ?? p?.image ?? "").trim();
  const candidates = useMemo(
    () => buildImageCandidates({ imagenRaw, nombre }),
    [imagenRaw, nombre]
  );
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [candidates.join("|")]);
  const imgSrc = idx < candidates.length ? candidates[idx] : null;

  const chips = useMemo(() => parseColores(colores), [colores]);
  const href = getProductHref({ id: p.id, nombre });

  return (
    <div className="card h-100 shadow-sm rounded-4 overflow-hidden">
      {/* Imagen más alta y redondeada */}
      {imgSrc ? (
        <img
          className="card-img-top"
          alt={nombre || "Producto"}
          src={imgSrc}
          onError={() => setIdx((i) => i + 1)}
          style={{
            objectFit: "cover",
            height: 260,
            borderRadius: "1rem",
            margin: 12,
          }}
        />
      ) : (
        <div
          className="card-img-top d-flex align-items-center justify-content-center"
          style={{
            height: 260,
            background: "#f2f2f2",
            color: "#999",
            borderRadius: "1rem",
            margin: 12,
          }}
        >
          Sin imagen
        </div>
      )}

      <div className="card-body d-flex flex-column">
        {categoria && (
          <div className="mb-1">
            <span className="badge text-bg-secondary">{categoria}</span>
          </div>
        )}

        <h5 className="card-title mb-1" style={{ lineHeight: 1.2 }}>
          {nombre}
        </h5>

        {precio != null && (
          <p className="card-text fw-semibold mb-2">{formatARS(Number(precio))}</p>
        )}

        {!!chips.length && (
          <div className="mt-auto mb-3 p-2 border rounded-3 bg-light">
            <div className="small text-muted mb-2">Colores disponibles</div>
            <div className="d-flex flex-wrap gap-3">
              {chips.map((c, i) => (
                <div key={i} className="text-center" style={{ width: 66 }}>
                  <span
                    title={c.label}
                    style={{
                      width: 24,
                      height: 24,
                      display: "inline-block",
                      borderRadius: 8,
                      background: c.hex,
                      border:
                        c.hex === "#ffffff"
                          ? "1px solid #ddd"
                          : "1px solid rgba(0,0,0,0.15)",
                    }}
                  />
                  <div className="mt-1" style={{ fontSize: 11 }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to={href} className="btn btn-primary w-100">Ver detalles</Link>
      </div>
    </div>
  );
}
