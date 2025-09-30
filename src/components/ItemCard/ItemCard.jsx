import { Link } from "react-router-dom";
import SmartImage from "../SmartImage/SmartImage";
import "./ItemCard.css"; // CSS lindo (abajo)

export default function ItemCard({ item }) {
  return (
    <div className="card h-100 shadow-sm product-card">
      <div className="product-img-wrap">
        <SmartImage
          src={item.pictureUrl}          // si viene del sheet, se usa primero
          names={[item.title]}           // sino, probará /images/<title>.<ext>
          alt={item.title}
          className="product-img"
          loading="lazy"
        />
      </div>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title mb-1">{item.title}</h5>
        <p className="card-text text-secondary small mb-2">{item.category}</p>
        <p className="mt-auto price-tag">${Number(item.price || 0).toLocaleString()}</p>
        <Link className="btn btn-primary mt-2" to={`/item/${item.id}`}>
          Ver detalle
        </Link>
      </div>
    </div>
  );
}
