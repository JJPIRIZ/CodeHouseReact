// src/components/NavBar/NavBar.jsx
import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import CartWidget from "../CartWidget/CartWidget";
import { getProducts } from "../../services/productsService";
import "./NavBar.css";

// Capitaliza
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

export default function NavBar() {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const products = await getProducts();
        console.log("[cats] sample products:", products.slice(0, 5)); // debug

        // 🔧 Construcción simple y robusta:
        // agrupamos por category (minúsculas) y guardamos el primer label legible
        const byCat = {};
        for (const p of products) {
          const id = String(p.category || "").trim().toLowerCase();
          if (!id) continue;
          if (!byCat[id]) {
            byCat[id] = (p.categoryLabel && String(p.categoryLabel).trim()) || cap(id);
          }
        }
        const list = Object.entries(byCat).map(([id, label]) => ({ id, label }));
        console.log("[cats] built:", list); // debug

        if (alive) setCats(list);
      } catch {
        if (alive) setCats([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Logo desde /public respetando base "/MasTecno/"
  const logoSrc = `${import.meta.env.BASE_URL}/images/mastecno.jpg`;

  return (
    <header>
      <nav className="navbar navbar-expand-lg custom-navbar shadow-sm">
        <div className="container-fluid position-relative">
          {/* Marca (izquierda) */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src={logoSrc}
              alt="Logo"
              width="44"
              height="44"
              className="rounded-circle me-2 border border-light"
            />
            <span>Mastecno</span>
          </Link>

          {/* Toggle móvil */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Centro + derecha */}
          <div className="collapse navbar-collapse" id="navbarNav">
            {/* MENÚ CENTRADO */}
            <div className="d-flex mx-lg-auto justify-content-center gap-2 nav-buttons">
              {/* Dropdown Productos */}
              <div className="dropdown">
                <button
                  className="btn btn-light nav-btn dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Productos
                </button>
                <ul className="dropdown-menu">
                  {/* “Todos” primero */}
                  <li>
                    <NavLink to="/" end className="dropdown-item">
                      Todos
                    </NavLink>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  {/* Categorías dinámicas */}
                  {cats.length === 0 ? (
                    <li><span className="dropdown-item disabled">Sin categorías</span></li>
                  ) : (
                    cats.map((c) => (
                      <li key={c.id}>
                        <NavLink to={`/category/${c.id}`} className="dropdown-item">
                          {c.label}
                        </NavLink>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Otros botones */}
              <NavLink to="/nosotros" className="btn btn-light nav-btn">Nosotros</NavLink>
              <NavLink to="/contacto" className="btn btn-light nav-btn">Contacto</NavLink>
            </div>

            {/* Carrito (derecha) */}
            <div className="ms-lg-3 d-flex justify-content-end">
              <CartWidget />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
