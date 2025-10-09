// src/pages/AdminHome.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isAdminSessionValid, setAdminSession, clearAdminSession } from "../utils/adminSession";

const DEFAULT_KEY = "mastecno";
const expectedKey = (import.meta.env.VITE_ADMIN_KEY?.trim() || DEFAULT_KEY);
const SESSION_MINUTES = Number(import.meta.env.VITE_ADMIN_SESSION_MIN || 30); // opcional

export default function AdminHome() {
  // ¿ya hay sesión?
  const [ok, setOk] = useState(isAdminSessionValid());
  const [inputKey, setInputKey] = useState("");
  const [keyError, setKeyError] = useState("");

  useEffect(() => {
    setOk(isAdminSessionValid());
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (String(inputKey) === expectedKey) {
      setAdminSession(SESSION_MINUTES || 30);
      setOk(true);
      setKeyError("");
    } else {
      setKeyError("Clave incorrecta.");
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setOk(false);
    setInputKey("");
    setKeyError("");
  };

  if (!ok) {
    return (
      <div className="container py-5" style={{ maxWidth: 520 }}>
        <div className="card shadow-sm">
          <div className="card-header">Acceso administración</div>
          <div className="card-body">
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Clave</label>
                <input
                  type="password"
                  className={`form-control ${keyError ? "is-invalid" : ""}`}
                  value={inputKey}
                  onChange={(e) => { setInputKey(e.target.value); setKeyError(""); }}
                  placeholder="Ingresá la clave"
                  autoFocus
                />
                {keyError && <div className="invalid-feedback">{keyError}</div>}
              </div>

              <div className="row g-2 align-items-end">
                <div className="col-auto">
                  <label className="form-label d-block">Duración</label>
                  <span className="badge text-bg-secondary">
                    {SESSION_MINUTES || 30} min
                  </span>
                </div>
                <div className="col">
                  <button className="btn btn-primary" type="submit">Entrar</button>
                  <Link className="btn btn-outline-secondary ms-2" to="/">Cancelar</Link>
                </div>
              </div>

              <div className="form-text mt-2">
                Definí <code>VITE_ADMIN_KEY</code> y opcional <code>VITE_ADMIN_SESSION_MIN</code> en tu <code>.env</code>.  
                Si no, clave por defecto: <b>{DEFAULT_KEY}</b> y duración 30 minutos.
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Panel
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Panel de administración</h4>
        <button className="btn btn-outline-danger" onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">Pedidos</h5>
              <p className="card-text text-muted mb-4">
                Ver, buscar, filtrar por fecha y actualizar el estado de las órdenes.
              </p>
              <Link to="/admin/orders" className="btn btn-primary mt-auto">Abrir órdenes</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">Sincronizar Sheet → Firestore</h5>
              <p className="card-text text-muted mb-4">
                Importar/actualizar productos desde Google Sheet a <code>productos</code>.
              </p>
              <Link to="/admin/import" className="btn btn-primary mt-auto">Abrir sincronizador</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">Productos (CRUD)</h5>
              <p className="card-text text-muted mb-4">
                Crear, editar y eliminar productos; manejar stock, precio y colores.
              </p>
              <Link to="/admin/products" className="btn btn-primary mt-auto">Abrir productos</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-info mt-4">
        Consejo: mientras navegues por el panel, la sesión se renueva automáticamente (ventana deslizante).
      </div>
    </div>
  );
}
