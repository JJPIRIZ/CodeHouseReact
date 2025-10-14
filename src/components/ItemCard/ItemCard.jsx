// src/components/ItemCard/ItemCard.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProductHref } from "../../services/productsService";
import { buildImageCandidates } from "../../utils/images";
import { formatARS } from "../../utils/pricing";
import "./ItemCard.css";

function parseColores(input) {
  if (Array.isArray(input)) return input.filter(Boolean);
  if (input == null) return [];
  const s = String(input);
  return s.replace(/[|/;]/g, ",").split(",").map((c) => c.trim()).filter(Boolean);
}

function colorNameToCss(name) {
  const key = String(name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "");
  const map = {
    blanco: "#ffffff", white: "#ffffff",
    negro: "#000000", black: "#000000",
    gris: "#808080", grisclaro: "#d3d3d3",
    plata: "#c0c0c0", silver: "#c0c0c0",
    rojo: "#ff0000", red: "#ff0000",
    rosa: "#ffc0cb", rosado: "#ffc0cb", pink: "#ffc0cb",
    naranja: "#ffa500", orange: "#ffa500",
    amarillo: "#ffd700", dorado: "#daa520", gold: "#daa520",
    verde: "#008000", verdeclaro: "#90ee90",
    celeste: "#00bfff", cyan: "#00ffff", turquesa: "#40e0d0",
    azul: "#0000ff",
    violeta: "#8a2be2", lila: "#c8a2c8", purpura: "#800080",
    beige: "#f5f5dc",
    marron: "#8b4513", brown: "#8b4513",
    bordo: "#800000",
    fucsia: "#ff00ff", magenta: "#ff00ff",
  };
  return map[key] || null;
}

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAwJyBoZWlnaHQ9JzIyMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCBmaWxsPSIjZWVlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGR5PSIuM2VtIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5TaW4gaW1hZ2VuPC90ZXh0Pjwvc3ZnPg==";

export default function ItemCard({ product }) {
  if (!product) return null;

  const name = product.nombre ?? product.name ?? "Producto";
  const categoria = product.categoria ?? product.category ?? "";
  const stock = Number(product.cantidad ?? product.stock ?? 0);
  const colores = useMemo(
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

  const sinStock = stock <= 0;

  return (
    <div className="card h-100 shadow-sm">
      <div className="position-relative">
        <img
          src={imgSrc}
          alt={name}
          className="card-img-top itemcard-img"
          onError={() => {
            if (imgIdx < candidates.length) setImgIdx((i) => i + 1);
          }}
        />
        {sinStock && (
          <span className="badge bg-danger itemcard-badge">Sin stock</span>
        )}
      </div>

      <div className="card-body d-flex flex-column">
        <h6 className="card-title mb-1 text-truncate">{name}</h6>

        {categoria && (
          <div className="mb-2">
            <span className="badge text-bg-secondary">{categoria}</span>
          </div>
        )}

        {colores.length > 0 && (
          <div
            className="mb-2 p-2"
            style={{
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 8,
              background: "#fafafa",
            }}
          >
            <div className="small text-muted mb-1">Colores disponibles</div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              {colores.map((c) => {
                const css = colorNameToCss(c);
                return css ? (
                  <span
                    key={c}
                    title={c}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: css,
                      border: "1px solid rgba(0,0,0,0.25)",
                      display: "inline-block",
                    }}
                  />
                ) : (
                  <span key={c} className="badge text-bg-light text-dark">
                    {c}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-grow-1" />

        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            {sinStock ? "Sin stock" : `Stock: ${stock}`}
          </small>
          <strong className="fs-6">{formatARS(price)}</strong>
        </div>

        <div className="mt-2">
          <Link className="btn btn-primary btn-sm w-100" to={getProductHref(product.id)}>
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
