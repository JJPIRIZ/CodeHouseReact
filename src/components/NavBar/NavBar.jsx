import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import CartWidget from "../CartWidget/CartWidget";
import { getCategories } from "../../services/productsService";
import "./NavBar.css";

export default function NavBar() {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await getCategories(); // [{id,label}]
        if (alive) setCats(list);
      } catch (e) {
        console.error("[NavBar] getCategories error:", e);
        if (alive) setCats([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const BASE = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "/");
  const logoSrc = `${BASE}images/mastecno.jpg`;

  return (
    <header>
      <nav className="navbar navbar-expand-lg custom-navbar shadow-sm navbar-light">
        <div className="container-fluid position-relative">
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

          <div className="collapse navbar-collapse" id="navbarNav">
            <div className="d-flex mx-lg-auto justify-content-center gap-2 nav-buttons">
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
                  <li>
                    <NavLink to="/" end className="dropdown-item">
                      Todos
                    </NavLink>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  {cats.length === 0 ? (
                    <li><span className="dropdown-item disabled">Sin categorías</span></li>
                  ) : (
                    cats.map((c) => (
                      <li key={c.id}>
                        <NavLink to={`/category/${encodeURIComponent(c.id)}`} className="dropdown-item">
                          {c.label}
                        </NavLink>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <NavLink to="/nosotros" className="btn btn-light nav-btn">Nosotros</NavLink>
              <NavLink to="/contacto" className="btn btn-light nav-btn">Contacto</NavLink>
            </div>

            <div className="ms-lg-3 d-flex justify-content-end">
              <CartWidget />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
