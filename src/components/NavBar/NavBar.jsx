import PropTypes from "prop-types";
import CartWidget from "../CartWidget/CartWidget";
import "./NavBar.css";

const BASE = import.meta.env.BASE_URL;

export default function NavBar({
  categorias = ["Todas"],
  selectedCategory = "Todas",
  onSelectCategory = () => {},
}) {
  return (
    <header>
      <nav className="navbar navbar-expand-lg custom-navbar shadow-sm">
        <div className="container-fluid position-relative">
          {/* Marca (izquierda) */}
          <a className="navbar-brand d-flex align-items-center" href="#">
            {/* Logo con BASE */}
            <img
              src={`${BASE}images/mastecno.jpg`}
              alt="Logo"
              width="44"
              height="44"
              className="rounded-circle me-2 border border-light"
            />
            <span>Mastecno</span>
          </a>

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
              {/* Productos como dropdown */}
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-light nav-btn dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Productos{selectedCategory && selectedCategory !== "Todas" ? ` · ${selectedCategory}` : ""}
                </button>
                <ul className="dropdown-menu">
                  {categorias.map((c) => (
                    <li key={c}>
                      <button
                        className={`dropdown-item ${c === selectedCategory ? "active" : ""}`}
                        onClick={() => onSelectCategory(c)}
                      >
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <a href="#" className="btn btn-light nav-btn">Nosotros</a>
              <a href="#" className="btn btn-light nav-btn">Contacto</a>
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

NavBar.propTypes = {
  categorias: PropTypes.arrayOf(PropTypes.string),
  selectedCategory: PropTypes.string,
  onSelectCategory: PropTypes.func,
};
