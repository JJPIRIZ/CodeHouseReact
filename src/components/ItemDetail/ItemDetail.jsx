import "./ItemDetail.css";
import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import useCart from "../../hooks/useCart";

// utils
import { formatARS, parsePriceAR } from "../../utils/pricing";
import { getStock, stockBadgeVariant } from "../../utils/inventory";
import { buildImageCandidates } from "../../utils/images";

// Mapa de colores (mismo criterio que en la card)
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

export default function ItemDetail({ producto }) {
  const { addItem } = useCart();

  if (!producto) {
    return <div>Producto no encontrado.</div>;
  }

  // Normalizo campos
  const id        = producto.id ?? producto.ID ?? producto._id ?? producto.codigo ?? producto.Codigo ?? producto.CÓDIGO ?? String(producto._rowId ?? "");
  const nombre    = producto.nombre ?? producto._1 ?? producto.Producto ?? "Producto";
  const categoria = producto.categoria ?? producto.Categoria ?? "";

  // precio robusto
  const precioRaw = producto.precio ?? producto._3 ?? producto["Precio Unitario"] ?? producto.Precio ?? null;
  const precio    = parsePriceAR(precioRaw);

  // stock unificado
  const stock = getStock(producto);
  const agotado = stock <= 0;

  // Colores
  const coloresRaw = producto.colores ?? producto.Color ?? producto.Colores ?? producto.color ?? "";
  const colores = useMemo(() => parseColores(coloresRaw), [coloresRaw]);

  // Imagen
  const imagenRaw = (producto.imagen ?? producto.Imagen ?? producto.image ?? "").trim();
  const [idx, setIdx] = useState(0);
  const candidates = useMemo(
    () => buildImageCandidates({ imagenRaw, nombre }),
    [imagenRaw, nombre]
  );
  useEffect(() => { setIdx(0); }, [candidates.join("|")]);
  const src = idx < candidates.length ? candidates[idx] : null;

  // Estado UI
  const [selectedColor, setSelectedColor] = useState(colores[0]?.label ?? "");
  useEffect(() => {
    setSelectedColor(colores[0]?.label ?? "");
  }, [colores.map(c => c.label).join("|")]);

  const [qty, setQty] = useState(1);

  // No permitir pedir más que el stock / manejar agotado
  useEffect(() => {
    if (agotado) setQty(1);
    else if (qty > stock) setQty(stock);
  }, [stock, agotado]);

  const handleAddToCart = () => {
    if (agotado || precio == null) return;

    const quantity = Math.min(Math.max(1, qty), stock); // guarda final
    const productForCart = {
      id: id ?? `${nombre}::${selectedColor}`,
      title: nombre,
      price: precio ?? 0,
      image: src || "",
      color: selectedColor || undefined,
    };
    addItem(productForCart, quantity);
    setQty(1);
  };

  return (
    <div className="item-detail-card card shadow-sm rounded-4 overflow-hidden">
      <div className="row g-0">
        {/* Imagen */}
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
          <div className="d-flex gap-2 align-items-center mb-2">
            {categoria && <span className="badge text-bg-secondary">{categoria}</span>}
            {agotado && <span className="badge text-bg-danger">Sin stock</span>}
          </div>

          <h2 className="mb-2">{nombre}</h2>

          {precio != null && (
            <p className="fs-4 fw-semibold mb-2">Precio: {formatARS(precio)}</p>
          )}

          {/* Stock visible */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className={`badge text-bg-${stockBadgeVariant(stock)}`}>
              {agotado ? "Sin stock" : `Stock: ${stock}`}
            </span>
            {!agotado && stock <= 2 && (
              <small className="text-muted">¡Últimas unidades!</small>
            )}
          </div>

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
              disabled={qty <= 1 || agotado}
              aria-label="Restar cantidad"
            >
              −
            </button>

            <input
              type="number"
              min={1}
              max={Math.max(1, stock)} // límite visual
              className="form-control text-center"
              style={{ width: 90 }}
              value={qty}
              onChange={(e) => {
                const v = Math.max(1, Number(e.target.value) || 1);
                setQty(agotado ? 1 : Math.min(v, stock));
              }}
              aria-label="Cantidad"
              disabled={agotado}
            />

            <button
              className="btn btn-outline-secondary"
              onClick={() => setQty((n) => Math.min(stock, n + 1))}
              disabled={agotado || qty >= stock}
              aria-label="Sumar cantidad"
            >
              +
            </button>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={precio == null || agotado}
              title={agotado ? "No hay stock disponible" : "Agregar al carrito"}
            >
              Agregar al carrito
            </button>
            <Link to="/" className="btn btn-outline-secondary">Volver</Link>
          </div>

          <div className="mt-auto" />
        </div>
      </div>
    </div>
  );
}
