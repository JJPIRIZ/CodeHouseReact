import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProductHref } from "../../services/productsService";

// utils
import { formatARS, parsePriceAR } from "../../utils/pricing";
import { getStock, stockBadgeVariant } from "../../utils/inventory";
import { buildImageCandidates } from "../../utils/images";

// === Helpers locales (colores) ===
const COLOR_MAP = {
  "blanco": "#ffffff", "negro": "#000000", "gris": "#808080", "beige": "#f5f5dc",
  "amarillo": "#ffd700", "naranja": "#ffa500", "rojo": "#ff3b30", "bordo": "#800000",
  "rosa": "#ffc0cb", "violeta": "#8a2be2", "lila": "#c8a2c8", "celeste": "#87ceeb",
  "azul": "#1e90ff", "azul oscuro": "#00008b", "verde": "#008000", "verde claro": "#90ee90",
};

function parseColores(s) {
  if (!s) return [];
  return s
    .split(/,|\/|\|/g)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => ({ label: c, hex: COLOR_MAP[c.toLowerCase()] ?? "#999999" }));
}

export default function ItemCard(props) {
  const p = props.item ?? props;

  const nombre =
    p?.nombre ?? p?._1 ?? p?.Producto ?? p?.producto ?? "Producto sin nombre";
  const categoria = p?.categoria ?? p?.Categoria ?? "";

  // precio robusto
  const precioRaw = p?.precio ?? p?._3 ?? p?.["Precio Unitario"] ?? null;
  const precio = parsePriceAR(precioRaw);

  const colores = p?.colores ?? p?.Color ?? p?.Colores ?? "";

  // stock unificado (utils)
  const stock = getStock(p);
  const agotado = stock <= 0;

  // imagen
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
    <div className={`card h-100 shadow-sm rounded-4 overflow-hidden position-relative ${agotado ? "oos" : ""}`}>
      {/* Marca de agua si no hay stock */}
      {agotado && (
        <div className="oos-watermark" aria-hidden>
          PRODUCTO AGOTADO
        </div>
      )}

      {/* Imagen */}
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
            filter: agotado ? "grayscale(1) opacity(0.75)" : "none",
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
        <div className="d-flex gap-2 align-items-center mb-1">
          {categoria && <span className="badge text-bg-secondary">{categoria}</span>}
          {agotado && <span className="badge text-bg-danger">Sin stock</span>}
        </div>

        <h5 className="card-title mb-1" style={{ lineHeight: 1.2 }}>
          {nombre}
        </h5>

        {precio != null && (
          <p className="card-text fw-semibold mb-2">{formatARS(precio)}</p>
        )}

        {/* Stock visible */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className={`badge text-bg-${stockBadgeVariant(stock)}`}>
            {agotado ? "Sin stock" : `Stock: ${stock}`}
          </span>
          {!agotado && stock <= 2 && (
            <small className="text-muted">¡Últimas unidades!</small>
          )}
        </div>

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

        <Link
          to={href}
          className={`btn w-100 ${agotado ? "btn-outline-secondary disabled pointer-events-none" : "btn-primary"}`}
          style={agotado ? { pointerEvents: "none", userSelect: "none" } : undefined}
          aria-disabled={agotado ? "true" : "false"}
        >
          {agotado ? "Sin stock" : "Ver detalles"}
        </Link>
      </div>
    </div>
  );
}
