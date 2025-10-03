// src/components/CartWidget/CartWidget.jsx
import { Link } from "react-router-dom";
import useCart from "../../hooks/useCart";

export default function CartWidget() {
  const { totalItems } = useCart();

  return (
    <Link to="/cart" className="btn btn-light position-relative d-inline-flex align-items-center">
      <span aria-hidden>🛒</span>
      <span className="ms-2">Carrito</span>

      {totalItems > 0 && (
        <span
          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
          style={{ fontSize: 12 }}
          aria-label={`${totalItems} productos en el carrito`}
        >
          {totalItems}
        </span>
      )}
    </Link>
  );
}
