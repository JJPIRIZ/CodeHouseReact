import { Link } from "react-router-dom";
import SmartImage from "../SmartImage/SmartImage";
import ItemCount from "./ItemCount";
import "./ItemDetail.css";

export default function ItemDetail({ item }) {
  const onAdd = (qty) => {
    // Acá luego vas a integrar con el carrito
    alert(`Agregaste ${qty} unidad(es) de ${item.title}`);
  };

  return (
    <section className="product-detail">
      {/* Breadcrumb simple */}
      <nav className="mb-3 small">
        <Link to="/">Inicio</Link>
        <span className="mx-2 text-secondary">/</span>
        <Link to={`/category/${item.category}`}>{item.categoryLabel || item.category}</Link>
        <span className="mx-2 text-secondary">/</span>
        <span className="text-secondary">{item.title}</span>
      </nav>

      <div className="detail-card shadow-sm">
        {/* Izquierda: imagen */}
        <div className="gallery">
          <div className="gallery-main">
            <SmartImage
              src={item.pictureUrl}
              names={[item.title]}
              alt={item.title}
              className="gallery-img"
            />
          </div>
        </div>

        {/* Derecha: info */}
        <div className="info">
          <h1 className="detail-title">{item.title}</h1>

          <div className="meta">
            <span className="badge rounded-pill text-bg-light">
              {item.categoryLabel || item.category}
            </span>
          </div>

          <div className="price-wrap">
            <span className="price">${Number(item.price || 0).toLocaleString()}</span>
            {/* <span className="price-note text-secondary">IVA inc.</span> si lo necesitás */}
          </div>

          <p className="detail-desc">
            {item.description && item.description.trim().length > 0
              ? item.description
              : "Producto sin descripción. Próximamente agregaremos más detalles."}
          </p>

          <div className="actions">
            <ItemCount stock={10} initial={1} onAdd={onAdd} />
            <div className="mt-3 d-flex gap-2">
              <Link to="/" className="btn btn-outline-secondary">Seguir comprando</Link>
              <Link to={`/category/${item.category}`} className="btn btn-outline-secondary">
                Ver {item.categoryLabel || item.category}
              </Link>
            </div>
          </div>

          {/* Datos secundarios (opcional) */}
          <ul className="specs small text-secondary mt-4">
            <li>Envíos a todo el país</li>
            <li>Garantía oficial</li>
            <li>Medios de pago habilitados</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
