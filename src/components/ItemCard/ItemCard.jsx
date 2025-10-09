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
          <div className="mb-2">
            {colores.map((c) => (
              <span key={c} className="badge text-bg-light text-dark me-1 mb-1">
                {c}
              </span>
            ))}
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
