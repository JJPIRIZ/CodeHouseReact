import "./ItemDetail.css";
import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import useCart from "../../hooks/useCart"; // 👈 usa el context del carrito

// Mapa de colores (mismo criterio que en la card)
const COLOR_MAP = {
  "blanco": "#ffffff", "negro": "#000000", "gris": "#808080", "beige": "#f5f5dc",
  "amarillo": "#ffd700", "naranja": "#ffa500", "rojo": "#ff3b30", "bordo": "#800000",
  "rosa": "#ffc0cb", "violeta": "#8a2be2", "lila": "#c8a2c8", "celeste": "#87ceeb",
  "azul": "#1e90ff", "azul oscuro": "#00008b", "verde": "#008000", "verde claro": "#90ee90",
};

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "/");

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

function parseColores(s) {
  if (!s) return [];
  return s
    .split(/,|\/|\|/g)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => ({ label: c, hex: COLOR_MAP[c.toLowerCase()] ?? "#999999" }));
}

// Soporta links directos o nombres de archivo dentro de /public/images
function toPublicImage(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s; // ya es URL
  if (s.startsWith("/")) return `${BASE.replace(/\/$/, "")}${s}`;
  const clean = s.replace(/^public\//i, "");
  const path = clean.startsWith("images/") ? clean : `images/${clean}`;
  return `${BASE}${path}`;
}

// Genera candidatos por nombre del producto (para casos donde Imagen está vacía)
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
function buildImageCandidates({ imagenRaw, nombre }) {
  const list = [];
  if (imagenRaw) list.push(toPublicImage(imagenRaw));
  const exts = ["webp", "jpg", "jpeg", "png", "avif"];
  for (const n of buildNameVariants(nombre)) {
    for (const ext of exts) {
      list.push(`${BASE}images/${n}.${ext}`);
    }
  }
  return Array.from(new Set(list));
}

export default function ItemDetail({ producto }) {
  const { addItem } = useCart(); // 👈 acciones del carrito

  if (!producto) {
    return <div>Producto no encontrado.</div>;
  }

  // Normalizo campos que pueden venir con diferentes nombres
  const id        = producto.id ?? producto.ID ?? producto._id ?? producto.codigo ?? producto.Codigo ?? producto.CÓDIGO ?? String(producto._rowId ?? "");
  const nombre    = producto.nombre ?? producto._1 ?? producto.Producto ?? "Producto";
  const categoria = producto.categoria ?? producto.Categoria ?? "";
  const precioRaw = producto.precio ?? producto._3 ?? producto["Precio Unitario"] ?? producto.Precio ?? null;
  const precio    = precioRaw != null ? Number(precioRaw) : null;

  const coloresRaw = producto.colores ?? producto.Color ?? producto.Colores ?? producto.color ?? "";
  const colores = useMemo(() => parseColores(coloresRaw), [coloresRaw]);

  const imagenRaw = (producto.imagen ?? producto.Imagen ?? producto.image ?? "").trim();
  const [idx, setIdx] = useState(0);
  const candidates = useMemo(
    () => buildImageCandidates({ imagenRaw, nombre }),
    [imagenRaw, nombre]
  );
  useEffect(() => { setIdx(0); }, [candidates.join("|")]);
  const src = idx < candidates.length ? candidates[idx] : null;

  // 👇 Estado para seleccionar color y cantidad
  const [selectedColor, setSelectedColor] = useState(colores[0]?.label ?? "");
  useEffect(() => {
    // si cambia el set de colores, re-selecciono
    setSelectedColor(colores[0]?.label ?? "");
  }, [colores.map(c => c.label).join("|")]);

  const [qty, setQty] = useState(1);

  const handleAddToCart = () => {
    // armo el objeto producto para el carrito
    const productForCart = {
      id: id ?? `${nombre}::${selectedColor}`, // fallback si no hay id
      title: nombre,
      price: precio ?? 0,
      image: src || "",          // guardo la imagen actual
      color: selectedColor || undefined, // guardo color si hay
      // Podrías sumar otras variantes si las tuvieras, ej: variant/talle
    };
    addItem(productForCart, qty);
    // opcional: reset cantidad
    setQty(1);
  };

  return (
    <div className="item-detail-card card shadow-sm rounded-4 overflow-hidden">
      <div className="row g-0">
        {/* Imagen grande, redondeada arriba */}
        <div className="col-12 col-md-6 p-3 p-md-4">
          {src ? (
            <img
              src={src}
              alt={nombre}
              onError={() => setIdx((i) => i + 1)}
              style={{
                width: "100%",
                height: 360,
                objectFit: "cover",
                borderRadius: "1rem",
              }}
            />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center bg-light"
              style={{ width: "100%", height: 360, borderRadius: "1rem", color: "#999" }}
            >
              Sin imagen
            </div>
          )}
        </div>

        {/* Info */}
        <div className="col-12 col-md-6 p-3 p-md-4 d-flex flex-column">
          {categoria && (
            <div className="mb-2">
              <span className="badge text-bg-secondary">{categoria}</span>
            </div>
          )}

          <h2 className="mb-2">{nombre}</h2>

          {precio != null && (
            <p className="fs-4 fw-semibold mb-3">Precio: {formatARS(precio)}</p>
          )}

          {!!colores.length && (
            <div className="mb-3 p-2 border rounded-3 bg-light">
              <div className="small text-muted mb-2">Colores disponibles</div>
              <div className="d-flex flex-wrap gap-3">
                {colores.map((c, i) => {
                  const isActive = selectedColor === c.label;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`text-center btn p-2 ${isActive ? "border-primary" : "border-0"}`}
                      style={{ width: 86, background: "transparent" }}
                      onClick={() => setSelectedColor(c.label)}
                      title={c.label}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          display: "inline-block",
                          borderRadius: 10,
                          background: c.hex,
                          border:
                            c.hex === "#ffffff"
                              ? "1px solid #d0d0d0"
                              : "1px solid rgba(0,0,0,0.2)",
                          boxShadow: isActive ? "0 0 0 3px rgba(13,110,253,.25)" : "none",
                        }}
                      />
                      <div className="mt-1" style={{ fontSize: 12 }}>
                        {c.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cantidad + Agregar al carrito */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              disabled={qty <= 1}
              aria-label="Restar cantidad"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              className="form-control text-center"
              style={{ width: 90 }}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              aria-label="Cantidad"
            />
            <button
              className="btn btn-outline-secondary"
              onClick={() => setQty((n) => n + 1)}
              aria-label="Sumar cantidad"
            >
              +
            </button>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={precio == null} // si no hay precio, prevenimos agregar
            >
              Agregar al carrito
            </button>
            <Link to="/" className="btn btn-outline-secondary">Volver</Link>
          </div>

          {/* space filler */}
          <div className="mt-auto" />
        </div>
      </div>
    </div>
  );
}
