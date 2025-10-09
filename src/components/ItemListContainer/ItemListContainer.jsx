// src/components/ItemListContainer/ItemListContainer.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductos, getProductsByCategory } from "../../services/productsService";
import ItemCard from "../ItemCard/ItemCard";
import "./ItemListContainer.css";

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}
function slug(s) {
  return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function ItemListContainer({ greeting }) {
  const { categoryId } = useParams();
  const wantedCat = useMemo(
    () => (categoryId ? decodeURIComponent(categoryId) : null),
    [categoryId]
  );

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔎 filtros UI
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("none"); // none | price_asc | price_desc

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (wantedCat) {
          let items = await getProductsByCategory(wantedCat);
          if (!items || items.length === 0) {
            const all = await getProductos();
            const wSlug = slug(wantedCat);
            items = all.filter(
              (p) =>
                String(p.categoria || "").trim() === wantedCat ||
                slug(p.categoria) === wSlug
            );
          }
          if (alive) setProductos(items || []);
        } else {
          const items = await getProductos();
          if (alive) setProductos(items || []);
        }
      } catch (e) {
        console.error("[ItemListContainer] fetch error:", e);
        if (alive) {
          setProductos([]);
          setError("No se pudieron cargar los productos");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [wantedCat]);

  // Aplico búsqueda + ordenamiento en cliente
  const display = useMemo(() => {
    let list = [...productos];

    const q = norm(search);
    if (q) {
      list = list.filter((p) => {
        const nombre = norm(p.nombre ?? p.name);
        const categoria = norm(p.categoria ?? p.category);
        const colores = norm(p.coloresString ?? p.colors ?? "");
        return (
          nombre.includes(q) ||
          categoria.includes(q) ||
          colores.includes(q)
        );
      });
    }

    if (order === "price_asc") {
      list.sort((a, b) => (a.price ?? a.precioUnitario ?? 0) - (b.price ?? b.precioUnitario ?? 0));
    } else if (order === "price_desc") {
      list.sort((a, b) => (b.price ?? b.precioUnitario ?? 0) - (a.price ?? a.precioUnitario ?? 0));
    }

    return list;
  }, [productos, search, order]);

  return (
    <div className="container py-3">
      {greeting && <h2 className="mb-3">{greeting}</h2>}

      {/* 🔎 Barra de búsqueda + orden */}
      <div className="row g-2 align-items-end mb-3">
        <div className="col-12 col-md-8">
          <label htmlFor="search" className="form-label mb-1">Buscar</label>
          <input
            id="search"
            className="form-control"
            placeholder="Nombre, categoría o color…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-4">
          <label htmlFor="order" className="form-label mb-1">Ordenar</label>
          <select
            id="order"
            className="form-select"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          >
            <option value="none">Sin ordenar</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>

      {loading && <div className="alert alert-secondary">Cargando…</div>}
      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        display.length === 0 ? (
          <div className="alert alert-info">No hay productos para mostrar.</div>
        ) : (
          <ul className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 list-unstyled">
            {display.map((p) => (
              <li key={p.id} className="col">
                <ItemCard product={p} />
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
