import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";

const IMG_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <rect width="100%" height="100%" fill="#e9ecef"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="16">
        Sin imagen
      </text>
    </svg>`
  );

const formatARS = (v) => {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(Number(v) || 0);
  } catch {
    return `$${v}`;
  }
};

// 🔑 usa import.meta.env.BASE_URL para respetar el base de vite
const BASE = import.meta.env.BASE_URL;

function buildCandidates(nombre) {
  const exts = ["jpg", "jpeg", "png"];
  return exts.map((ext) => `${BASE}images/${nombre}.${ext}`);
}

export default function ItemDetail({ item, onAdd, className = "" }) {
  const sinStock = Number(item._2) === 0;
  const candidates = buildCandidates(item._1);

  const tried = useRef(new Set());
  const [currentSrc, setCurrentSrc] = useState(candidates[0]);

  useEffect(() => {
    tried.current = new Set();
    setCurrentSrc(candidates[0]);
  }, [item?._1]);

  const handleImgError = () => {
    tried.current.add(currentSrc);
    const next = candidates.find((c) => !tried.current.has(c));
    setCurrentSrc(next || IMG_FALLBACK);
  };

  return (
    <div className={`card h-100 shadow-sm ${className}`}>
      <img
        src={currentSrc}
        className="card-img-top object-fit-contain"
        alt={item._1}
        onError={handleImgError}
        loading="lazy"
        style={{ maxHeight: 220 }}
      />
      <div className="card-body text-center">
        <h5 className="card-title">{item._1}</h5>
        <p className="card-text mb-1">Stock: {item._2}</p>
        <h6 className="text-success fw-bold">{formatARS(item._3)}</h6>
        <button
          className="btn btn-primary mt-2"
          disabled={sinStock}
          onClick={() => onAdd?.(item)}
        >
          {sinStock ? "Sin stock" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}

ItemDetail.propTypes = {
  item: PropTypes.shape({
    _1: PropTypes.string.isRequired,
    _2: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    _3: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  onAdd: PropTypes.func,
  className: PropTypes.string,
};
