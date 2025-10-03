// src/pages/Cart.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useCart from "../hooks/useCart";

export default function Cart() {
  const {
    items,
    totalAmount,
    increment,
    decrement,
    removeItem,
    itemKeyOf,
    clear,
  } = useCart();

  const navigate = useNavigate();

  // Redirige con SweetAlert2 si el carrito está vacío
  useEffect(() => {
    if (items.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Carrito vacío",
        text: "Elegí productos para continuar con tu compra.",
        confirmButtonText: "Ir al catálogo",
        confirmButtonColor: "#0d6efd",
        allowOutsideClick: false,
      }).then(() => {
        navigate("/", { replace: true });
      });
    }
  }, [items.length, navigate]);

  // Evita parpadeo mientras redirige
  if (items.length === 0) return null;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Carrito</h4>
        <button className="btn btn-outline-danger" onClick={clear}>
          Vaciar
        </button>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th style={{ minWidth: 140 }}>Cantidad</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={itemKeyOf(p)}>
                <td className="d-flex align-items-center gap-2">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.title}
                      width={48}
                      height={48}
                      style={{ objectFit: "cover", borderRadius: 6 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: "#eee",
                        borderRadius: 6,
                      }}
                    />
                  )}
                  <div>
                    <div className="fw-semibold">{p.title}</div>
                    {p.color && (
                      <small className="text-muted">Color: {p.color}</small>
                    )}
                    {p.variant && (
                      <small className="text-muted ms-2">
                        Variante: {p.variant}
                      </small>
                    )}
                  </div>
                </td>
                <td>${Number(p.price).toFixed(2)}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => decrement(p)}
                      aria-label="Restar"
                    >
                      −
                    </button>
                    <span style={{ width: 28 }} className="text-center">
                      {p.qty}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => increment(p)}
                      aria-label="Sumar"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>${(Number(p.price) * p.qty).toFixed(2)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeItem(p)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end">
        <div className="card p-3" style={{ minWidth: 280 }}>
          <div className="d-flex justify-content-between">
            <span>Total</span>
            <strong>${totalAmount.toFixed(2)}</strong>
          </div>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/checkout")}
          >
            Finalizar compra
          </button>
        </div>
      </div>
    </div>
  );
}
