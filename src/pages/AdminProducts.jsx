// src/pages/AdminProducts.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import Swal from "sweetalert2";
import { slugify, removeDiacritics } from "../utils/strings";
import { formatARS } from "../utils/pricing";
import { isAdminSessionValid, touchAdminSession } from "../utils/adminSession";

// ----------------- helpers -----------------
function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}
function parseColoresInput(s) {
  if (!s) return [];
  return String(s)
    .split(",")
    .map((x) => removeDiacritics(String(x).trim()))
    .map((x) => x.replace(/\s+/g, " "))
    .filter(Boolean);
}
function coloresToInput(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join(", ");
}

function Modal({ show, title, onClose, children, size = "lg" }) {
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}

// ----------------- page -----------------
export default function AdminProducts() {
  // Guard de sesión
  const [hasSession, setHasSession] = useState(isAdminSessionValid());
  useEffect(() => {
    if (isAdminSessionValid()) {
      touchAdminSession();
      setHasSession(true);
    } else {
      setHasSession(false);
    }
  }, []);
  if (!hasSession) return <Navigate to="/admin" replace />;

  // Data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const cats = useMemo(() => {
    const set = new Set(items.map((p) => String(p.categoria || "").trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const load = async () => {
    touchAdminSession();
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "productos"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.nombre?.localeCompare?.(b.nombre || "") || 0);
      setItems(list);
    } catch (e) {
      console.error("[AdminProducts] load error:", e);
      Swal.fire({ icon: "error", text: "No se pudieron cargar los productos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const display = useMemo(() => {
    let list = [...items];
    if (cat !== "all") list = list.filter((p) => String(p.categoria) === cat);
    const needle = norm(q);
    if (needle) {
      list = list.filter((p) => {
        const blob = `${norm(p.nombre)} ${norm(p.categoria)} ${norm(coloresToInput(p.colores))} ${norm(p.id)}`;
        return blob.includes(needle);
      });
    }
    return list;
  }, [items, cat, q]);

  // ----------------- modal create/edit -----------------
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false); // false = nuevo, true = editando
  const [autoId, setAutoId] = useState(true); // actualiza id desde nombre (default true en "Nuevo")
  const [form, setForm] = useState({
    id: "",
    nombre: "",
    categoria: "",
    cantidad: 0,
    precioUnitario: 0,
    coloresInput: "",
  });

  const openNew = () => {
    touchAdminSession();
    setEditing(false);
    setAutoId(true);
    setForm({
      id: "",
      nombre: "",
      categoria: "",
      cantidad: 0,
      precioUnitario: 0,
      coloresInput: "",
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    touchAdminSession();
    setEditing(true);
    setAutoId(false); // por defecto no tocamos ID en edición
    setForm({
      id: p.id || "",
      nombre: p.nombre || "",
      categoria: p.categoria || "",
      cantidad: Number(p.cantidad ?? 0),
      precioUnitario: Number(p.precioUnitario ?? 0),
      coloresInput: coloresToInput(p.colores),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(false);
  };

  const onChange = (e) => {
    touchAdminSession();
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "cantidad" || name === "precioUnitario" ? Number(value) : value,
    }));
    if (name === "nombre" && autoId) {
      const slug = slugify(value || "");
      setForm((f) => ({ ...f, id: slug }));
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    touchAdminSession();
    const id = String(form.id || "").trim();
    const nombre = String(form.nombre || "").trim();
    if (!id || !nombre) {
      Swal.fire({ icon: "warning", text: "Completá al menos ID y Nombre." });
      return;
    }
    const payload = {
      id,
      nombre,
      categoria: String(form.categoria || "").trim(),
      cantidad: Math.max(0, Number(form.cantidad || 0)),
      precioUnitario: Math.max(0, Number(form.precioUnitario || 0)),
      colores: parseColoresInput(form.coloresInput),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "productos", id), payload, { merge: true });
      Swal.fire({
        icon: "success",
        text: editing ? "Producto actualizado." : "Producto creado.",
      });
      setShowModal(false);
      setEditing(false);
      load();
    } catch (e) {
      console.error("[AdminProducts] save error:", e);
      Swal.fire({ icon: "error", text: "No se pudo guardar el producto." });
    }
  };

  const onDelete = async (p) => {
    touchAdminSession();
    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar producto?",
      text: p.nombre || p.id,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteDoc(doc(db, "productos", p.id));
      Swal.fire({ icon: "success", text: "Producto eliminado." });
      load();
    } catch (e) {
      console.error("[AdminProducts] delete error:", e);
      Swal.fire({ icon: "error", text: "No se pudo eliminar el producto." });
    }
  };

  return (
    <div className="container py-4">
      {/* Header con volver */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Productos (CRUD)</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={openNew}>
            Nuevo producto
          </button>
          <Link to="/admin" className="btn btn-outline-secondary">
            Volver al panel
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
        <div className="form-floating">
          <select
            id="f-cat"
            className="form-select"
            value={cat}
            onChange={(e) => {
              touchAdminSession();
              setCat(e.target.value);
            }}
          >
            <option value="all">Todas</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label htmlFor="f-cat">Categoría</label>
        </div>
        <div className="form-floating">
          <input
            id="f-q"
            className="form-control"
            placeholder="Buscar…"
            value={q}
            onChange={(e) => {
              touchAdminSession();
              setQ(e.target.value);
            }}
          />
          <label htmlFor="f-q">Buscar</label>
        </div>
        <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
          {loading ? "Actualizando…" : "Refrescar"}
        </button>
      </div>

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Colores</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {display.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="fw-semibold">{p.nombre}</div>
                  <small className="text-muted">{p.id}</small>
                </td>
                <td>{p.categoria || "-"}</td>
                <td>{Number(p.cantidad ?? 0)}</td>
                <td>{formatARS(Number(p.precioUnitario ?? 0))}</td>
                <td>{coloresToInput(p.colores) || "-"}</td>
                <td className="text-end">
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openEdit(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(p)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {display.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="alert alert-info mb-0">
                    No hay productos para mostrar.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title={editing ? "Editar producto" : "Nuevo producto"}
        size="lg"
      >
        <form onSubmit={onSave} className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Nombre</label>
            <input
              className="form-control"
              name="nombre"
              value={form.nombre}
              onChange={onChange}
              placeholder="Ej: Cargador Iphone"
              required
              autoFocus
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">ID (slug)</label>
            <input
              className="form-control"
              name="id"
              value={form.id}
              onChange={onChange}
              placeholder="cargador-iphone"
              required
            />
            <div className="form-text">Se usa como ID de documento en Firestore.</div>
          </div>
          <div className="col-md-2">
            <label className="form-label d-block">&nbsp;</label>
            <div className="form-check">
              <input
                id="auto-id"
                type="checkbox"
                className="form-check-input"
                checked={autoId}
                onChange={(e) => setAutoId(e.target.checked)}
                disabled={editing && form.id === ""}
              />
              <label htmlFor="auto-id" className="form-check-label">
                Actualizar ID por nombre
              </label>
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label">Categoría</label>
            <input
              className="form-control"
              name="categoria"
              value={form.categoria}
              onChange={onChange}
              placeholder="Cargadores"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Stock</label>
            <input
              type="number"
              className="form-control"
              name="cantidad"
              value={form.cantidad}
              onChange={onChange}
              min={0}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Precio</label>
            <input
              type="number"
              className="form-control"
              name="precioUnitario"
              value={form.precioUnitario}
              onChange={onChange}
              min={0}
            />
            <div className="form-text">
              {formatARS(Number(form.precioUnitario || 0))}
            </div>
          </div>
          <div className="col-md-12">
            <label className="form-label">Colores (separar por comas)</label>
            <input
              className="form-control"
              name="coloresInput"
              value={form.coloresInput}
              onChange={onChange}
              placeholder="Blanco, Negro, Azul"
            />
          </div>

          <div className="col-12 d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" type="button" onClick={closeModal}>
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit">
              {editing ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
