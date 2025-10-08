import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductos, getProductsByCategory } from "../../services/productsService";
import ItemCard from "../ItemCard/ItemCard";
import "./ItemListContainer.css";

function slug(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  return (
    <div className="container py-3">
      {greeting && <h2 className="mb-3">{greeting}</h2>}
      {loading && <div className="alert alert-secondary">Cargando…</div>}
      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        productos.length === 0 ? (
          <div className="alert alert-info">No hay productos para mostrar.</div>
        ) : (
          <ul className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 list-unstyled">
            {productos.map((p) => (
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
