// src/components/ItemDetail/ItemDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildImageCandidates } from "../../utils/images";
import { formatARS } from "../../utils/pricing";
import "./ItemDetail.css";
import { useCartContext as useCart } from "../../context/CartContext.jsx";

function parseColores(input) {
  if (Array.isArray(input)) return input.filter(Boolean);
  if (input == null) return [];
  const s = String(input);
  return s.replace(/[|/;]/g, ",").split(",").map((c) => c.trim()).filter(Boolean);
}

// mismo mapeo que en ItemCard para mostrar “burbujitas”
function colorNameToCss(name) {
  const key = String(name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "");
  const map = {
    blanco: "#ffffff",
    white: "#ffffff",
    negro: "#000000",
    black: "#000000",
    gris: "#808080",
    grisclaro: "#d3d3d3",
    plata: "#c0c0c0",
    silver: "#c0c0c0",
    rojo: "#ff0000",
    red: "#ff0000",
    rosa: "#ffc0cb",
    rosado: "#ffc0cb",
    pink: "#ffc0cb",
    naranja: "#ffa500",
    orange: "#ffa500",
    amarillo: "#ffd700",
    dorado: "#daa520",
    gold: "#daa520",
    verde: "#008000",
    verdeclaro: "#90ee90",
    celeste: "#00bfff",
    cyan: "#00ffff",
    turquesa: "#40e0d0",
    azul: "#0000ff",
    violeta: "#8a2be2",
    lila: "#c8a2c8",
    purpura: "#800080",
    beige: "#f5f5dc",
    marron: "#8b4513",
    brown: "#8b4513",
    bordo: "#800000",
    fucsia: "#ff00ff",
    magenta: "#ff00ff",
  };
  return map[key] || null;
}

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAwJyBoZWlnaHQ9JzIyMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCBmaWxsPSIjZWVlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGR5PSIuM2VtIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5TaW4gaW1hZ2VuPC90ZXh0Pjwvc3ZnPg==";

export default function ItemDetail({ product }) {
  if (!product) return null;

  const { addItem } = useCart() || {};

  const name = product.nombre ?? product.name ?? "Producto";
  const categoria = product.categoria ?? product.category ?? "";
  const stock = Number(product.cantidad ?? product.stock ?? 0);
  const coloresArr = useMemo(
    () => parseColores(product.colors ?? product.colores),
    [product.colors, product.colores]
  );
  const price =
    typeof product.price === "number"
      ? product.price
      : typeof product.precioUnitario === "number"
      ? product.precioUnitario
      : Number(product.price ?? product.precioUnitario) || 0;

  const candidates = useMemo(
    () =>
      buildImageCandidates({
        imagenRaw: product.image ?? product.imageUrl,
        nombre: name,
        exts: ["webp", "jpg", "jpeg", "png", "avif"],
      }),
    [product.image, product.imageUrl, name]
  );
  const [imgIdx, setImgIdx] = useState(0);
  const imgSrc = candidates[imgIdx] || PLACEHOLDER;

  const [color, setColor] = useState(coloresArr[0] || "");
  const [qty, setQty] = useState(stock > 0 ? 1 : 0);
  const [adding, setAdding] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setColor(coloresArr[0] || "");
    setQty(stock > 0 ? 1 : 0);
    setOk(false);
    setAdding(false);
  }, [product?.id, stock, coloresArr.join("|")]);

  const canChooseColor = coloresArr.length > 0;
  const canAdd = stock > 0 && qty > 0 && (!canChooseColor || !!color);

  const handleAdd = () => {
    if (!addItem || !canAdd) return;
    setAdding(true);
    try {
      // guardo imagen (para ver en el carrito), título y color
      addItem(
        {
          id: product.id,
          title: name,
          price,
          image: imgSrc,
          color: color || undefined,
        },
        qty
      );
      setOk(true);
    } catch (e) {
      console.error("[ItemDetail] addItem error:", e);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container py-3">
      {/* Botones volver */}
      <div className="d-flex gap-2 mb-3">
        <Link to="/" className="btn btn-outline-secondary btn-sm">← Volver al inicio</Link>
        {categoria && (
          <Link
            to={`/category/${encodeURIComponent(categoria)}`}
            className="btn btn-outline-secondary btn-sm"
          >
            ← Volver a {categoria}
          </Link>
        )}
      </div>

      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="card position-relative">
            <img
              src={imgSrc}
              alt={name}
              className="card-img-top itemdetail-img"
              onError={() => {
                if (imgIdx < candidates.length) setImgIdx((i) => i + 1);
              }}
            />
            {stock <= 0 && (
              <span className="badge bg-danger itemdetail-badge">Sin stock</span>
            )}
          </div>
        </div>

        <div className="col-12 col-md-6">
          <h3 className="mb-2">{name}</h3>

          <div className="mb-2 d-flex align-items-center gap-2">
            {categoria && <span className="badge text-bg-secondary">{categoria}</span>}
            {stock <= 0 && <span className="badge bg-danger">Sin stock</span>}
          </div>

          <div className="d-flex align-items-center justify-content-between mb-3">
            <small className="text-muted">Stock: {stock}</small>
            <strong className="fs-4">{formatARS(price)}</strong>
          </div>

          {canChooseColor && (
            <div className="mb-3">
              <label className="form-label fw-semibold">Color</label>
              <div className="d-flex flex-wrap gap-2">
                {coloresArr.map((c) => {
                  const css = colorNameToCss(c);
                  const active = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setColor(c)}
                      title={c}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {css ? (
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            backgroundColor: css,
                            border: "1px solid rgba(0,0,0,0.25)",
                            display: "inline-block",
                          }}
                        />
                      ) : (
                        <span className="badge text-bg-light border">{c}</span>
                      )}
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="qty" className="form-label fw-semibold">Cantidad</label>
            <div className="input-group" style={{ maxWidth: 220 }}>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={stock <= 0 || qty <= 1}
              >
                −
              </button>
              <input
                id="qty"
                type="number"
                className="form-control text-center"
                min={1}
                max={stock}
                value={qty}
                onChange={(e) => {
                  const v = Number(e.target.value || 0);
                  if (!Number.isFinite(v)) return;
                  setQty(Math.min(Math.max(1, v), stock));
                }}
                disabled={stock <= 0}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                disabled={stock <= 0 || qty >= stock}
              >
                +
              </button>
            </div>
            <div className="form-text">Máximo disponible: {stock}</div>
          </div>

          <div className="d-grid gap-2">
            <button
              className={`btn ${ok ? "btn-success" : "btn-primary"}`}
              onClick={handleAdd}
              disabled={!canAdd || adding}
              title={!canAdd ? "Seleccioná opciones disponibles" : "Agregar al carrito"}
            >
              {ok ? "¡Agregado!" : adding ? "Agregando…" : "Agregar al carrito"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
