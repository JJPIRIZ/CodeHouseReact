// src/pages/Checkout.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import useCart from "../hooks/useCart";
import { createOrderAndDecrementStock } from "../services/ordersService";
import { formatARS } from "../utils/pricing";

export default function Checkout() {
  const { items, totalAmount, clear } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [sending, setSending] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">
          No hay productos en el carrito.{" "}
          <Link to="/" className="alert-link">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) {
      Swal.fire({ icon: "warning", text: "Completá nombre, teléfono y email." });
      return;
    }
    setSending(true);
    try {
      const { orderId } = await createOrderAndDecrementStock({
        items,
        buyer: form,
      });

      clear();
      await Swal.fire({
        icon: "success",
        title: "¡Compra registrada!",
        html: `Tu número de orden es <b>${orderId}</b>.<br/>Total: <b>${formatARS(totalAmount)}</b>`,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#0d6efd",
      });
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[Checkout] error", err);
      Swal.fire({
        icon: "error",
        title: "No se pudo completar la compra",
        text: String(err?.message || err),
        confirmButtonText: "Entendido",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container py-4">
      <h4 className="mb-3">Checkout</h4>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Nombre y apellido</label>
              <input
                name="name"
                className="form-control"
                value={form.name}
                onChange={onChange}
                disabled={sending}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Teléfono</label>
              <input
                name="phone"
                className="form-control"
                value={form.phone}
                onChange={onChange}
                disabled={sending}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                name="email"
                type="email"
                className="form-control"
                value={form.email}
                onChange={onChange}
                disabled={sending}
              />
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={sending}>
                {sending ? "Procesando…" : "Confirmar compra"}
              </button>
              <Link to="/" className="btn btn-outline-secondary">Cancelar</Link>
            </div>
          </form>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-header">Resumen</div>
            <ul className="list-group list-group-flush">
              {items.map((i) => (
                <li key={`${i.id}::${i.color ?? ""}`} className="list-group-item d-flex justify-content-between">
                  <span>
                    {i.title || i.nombre} {i.color ? `(${i.color})` : ""}
                    <small className="text-muted ms-2">x{i.qty}</small>
                  </span>
                  <strong>{formatARS(Number(i.price) * i.qty)}</strong>
                </li>
              ))}
              <li className="list-group-item d-flex justify-content-between">
                <span>Total</span>
                <strong>{formatARS(totalAmount)}</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
