// src/pages/AdminOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getOrders, updateOrderStatus } from "../services/ordersService";
import { formatARS } from "../utils/pricing";
import { isAdminSessionValid, touchAdminSession } from "../utils/adminSession";

const STATUS_OPTIONS = [
  { value: "created",   label: "Creada" },
  { value: "paid",      label: "Pagada" },
  { value: "shipped",   label: "Enviada" },
  { value: "cancelled", label: "Cancelada" },
];

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return d.toLocaleString?.("es-AR") || String(d);
  }
}

// Helpers de fechas
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dayStartFromStr(s) {
  const [y, m, d] = (s || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
function dayEndFromStr(s) {
  const [y, m, d] = (s || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}
function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function Modal({ show, title, onClose, children, size = "lg" }) {
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [show]);

  if (!show) return null;
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className={`modal-dialog modal-${size} modal-dialog-scrollable`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}

export default function AdminOrders() {
  // ❗ Guard simple: si no hay sesión, volvemos al panel de admin
  const [hasSession, setHasSession] = useState(isAdminSessionValid());
  useEffect(() => {
    if (isAdminSessionValid()) {
      touchAdminSession(); // renueva sesión al entrar
      setHasSession(true);
    } else {
      setHasSession(false);
    }
  }, []);
  if (!hasSession) return <Navigate to="/admin" replace />;

  // Data
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Filtro por fechas
  const today = useMemo(() => new Date(), []);
  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");
  const fromDate = useMemo(() => dayStartFromStr(fromStr), [fromStr]);
  const toDate   = useMemo(() => dayEndFromStr(toStr), [toStr]);

  const setQuickRange = (kind) => {
    touchAdminSession();
    const end = new Date();
    if (kind === "today") {
      setFromStr(ymd(end)); setToStr(ymd(end)); return;
    }
    if (kind === "7d")  { const s = addDays(end, -6);  setFromStr(ymd(s)); setToStr(ymd(end)); return; }
    if (kind === "30d") { const s = addDays(end, -29); setFromStr(ymd(s)); setToStr(ymd(end)); return; }
    setFromStr(""); setToStr("");
  };

  const load = async () => {
    touchAdminSession();
    setLoading(true);
    try {
      const list = await getOrders();
      setOrders(list);
    } catch (e) {
      console.error("[AdminOrders] getOrders error:", e);
      Swal.fire({ icon: "error", text: "No se pudieron cargar las órdenes." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const openModal = (order) => { touchAdminSession(); setSelectedOrder(order); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedOrder(null); };

  // Filtros en cliente
  const display = useMemo(() => {
    let list = [...orders];
    if (status !== "all") list = list.filter((o) => o.status === status);
    if (fromDate) list = list.filter((o) => (o.createdAt?.getTime?.() ?? 0) >= fromDate.getTime());
    if (toDate)   list = list.filter((o) => (o.createdAt?.getTime?.() ?? 0) <= toDate.getTime());

    const q = norm(search);
    if (q) {
      list = list.filter((o) => {
        const buyer = `${norm(o.buyer.name)} ${norm(o.buyer.email)} ${norm(o.buyer.phone)}`;
        const id = norm(o.id);
        const itemsText = o.items.map((it) => `${norm(it.title)} ${norm(it.color)}`).join(" ");
        return buyer.includes(q) || id.includes(q) || itemsText.includes(q);
      });
    }
    return list;
  }, [orders, status, search, fromDate, toDate]);

  const handleChangeStatus = async (orderId, newStatus) => {
    touchAdminSession();
    const prev = orders.find((o) => o.id === orderId)?.status;
    if (prev === newStatus) return;
    const confirm = await Swal.fire({
      icon: "question",
      title: "¿Actualizar estado?",
      text: `Pasar de "${prev}" a "${newStatus}"`,
      showCancelButton: true,
      confirmButtonText: "Sí, actualizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0d6efd",
    });
    if (!confirm.isConfirmed) return;

    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prevList) =>
        prevList.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      Swal.fire({ icon: "success", text: "Estado actualizado." });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((o) => (o ? { ...o, status: newStatus } : o));
      }
    } catch (e) {
      console.error("[AdminOrders] updateOrderStatus error:", e);
      Swal.fire({ icon: "error", text: "No se pudo actualizar el estado." });
    }
  };

  return (
    <div className="container py-4">
      {/* Header con volver */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Pedidos (Admin)</h4>
        <Link to="/admin" className="btn btn-outline-secondary">Volver al panel</Link>
      </div>

      {/* Filtros */}
      <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
        <div className="form-floating">
          <select
            id="f-status"
            className="form-select"
            value={status}
            onChange={(e) => { touchAdminSession(); setStatus(e.target.value); }}
          >
            <option value="all">Todos</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <label htmlFor="f-status">Estado</label>
        </div>

        <div className="form-floating">
          <input
            id="f-search"
            className="form-control"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => { touchAdminSession(); setSearch(e.target.value); }}
          />
          <label htmlFor="f-search">Buscar</label>
        </div>

        <div className="d-flex flex-column">
          <div className="d-flex gap-2">
            <div className="form-floating">
              <input
                type="date"
                id="f-from"
                className="form-control"
                value={fromStr}
                onChange={(e) => { touchAdminSession(); setFromStr(e.target.value); }}
                max={toStr || undefined}
              />
              <label htmlFor="f-from">Desde</label>
            </div>
            <div className="form-floating">
              <input
                type="date"
                id="f-to"
                className="form-control"
                value={toStr}
                onChange={(e) => { touchAdminSession(); setToStr(e.target.value); }}
                min={fromStr || undefined}
                max={ymd(today)}
              />
              <label htmlFor="f-to">Hasta</label>
            </div>
          </div>
          <div className="d-flex gap-2 mt-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setQuickRange("today")}>Hoy</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setQuickRange("7d")}>7 días</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setQuickRange("30d")}>30 días</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setQuickRange("all")}>Todo</button>
          </div>
        </div>

        <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
          {loading ? "Actualizando…" : "Refrescar"}
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="alert alert-secondary">Cargando…</div>
      ) : display.length === 0 ? (
        <div className="alert alert-info">No hay pedidos para mostrar.</div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Fecha</th>
                <th>Comprador</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {display.map((o) => (
                <tr key={o.id}>
                  <td><code>{o.id}</code></td>
                  <td>
                    <div>{fmtDate(o.createdAt)}</div>
                    {o.updatedAt && <small className="text-muted">Act: {fmtDate(o.updatedAt)}</small>}
                  </td>
                  <td>
                    <div className="fw-semibold">{o.buyer.name}</div>
                    <small className="text-muted">{o.buyer.email}</small><br/>
                    <small className="text-muted">{o.buyer.phone}</small>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openModal(o)}
                      title="Ver detalle de ítems"
                    >
                      Ver ítems ({o.items.length})
                    </button>
                  </td>
                  <td><strong>{formatARS(o.total)}</strong></td>
                  <td style={{ minWidth: 180 }}>
                    <select
                      className="form-select form-select-sm"
                      value={o.status}
                      onChange={(e) => handleChangeStatus(o.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => openModal(o)}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de items */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title={selectedOrder ? `Orden ${selectedOrder.id}` : "Orden"}
        size="lg"
      >
        {selectedOrder && (
          <>
            <div className="row g-3 mb-2">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">Comprador</div>
                  <div className="card-body">
                    <div className="fw-semibold">{selectedOrder.buyer.name}</div>
                    <div className="text-muted">{selectedOrder.buyer.email}</div>
                    <div className="text-muted">{selectedOrder.buyer.phone}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 d-flex flex-column gap-2">
                <div className="card">
                  <div className="card-header">Fechas</div>
                  <div className="card-body">
                    <div>Creada: <strong>{fmtDate(selectedOrder.createdAt)}</strong></div>
                    <div>Actualizada: <strong>{fmtDate(selectedOrder.updatedAt)}</strong></div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">Estado</div>
                  <div className="card-body d-flex gap-2 align-items-center">
                    <select
                      className="form-select form-select-sm"
                      style={{ maxWidth: 220 }}
                      value={selectedOrder.status}
                      onChange={(e) => handleChangeStatus(selectedOrder.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <span className="ms-auto">
                      Total: <strong>{formatARS(selectedOrder.total)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Color</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((it, i) => (
                    <tr key={`${it.id}-${i}`}>
                      <td>{it.title}</td>
                      <td>{it.color || "-"}</td>
                      <td>{it.qty}</td>
                      <td>{formatARS(it.price)}</td>
                      <td><strong>{formatARS(it.subtotal)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
