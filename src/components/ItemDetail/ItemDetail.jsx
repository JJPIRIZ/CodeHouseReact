import { useEffect, useMemo, useState } from "react";
import { buildImageCandidates } from "../../utils/images";
import "./ItemDetail.css";
import { useCartContext as useCart } from "../../context/CartContext.jsx";

function parseColores(input) {
  if (Array.isArray(input)) return input.filter(Boolean);
  if (input == null) return [];
  const s = String(input);
  return s.replace(/[|/;]/g, ",").split(",").map((c) => c.trim()).filter(Boolean);
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
      // ✅ Siempre incluimos el color dentro del item
      addItem({ ...product, color }, qty);
      setOk(true);
    } catch (e) {
      console.error("[ItemDetail] addItem error:", e);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container py-3">
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
            <strong className="fs-4">${price.toLocaleString("es-AR")}</strong>
          </div>

          {coloresArr.length > 0 && (
            <div className="mb-3">
              <label className="form-label fw-semibold">Color</label>
              <div className="d-flex flex-wrap gap-2">
                {coloresArr.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`btn btn-sm ${color === c ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setColor(c)}
                  >
                    {c}
                  </button>
                ))}
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
