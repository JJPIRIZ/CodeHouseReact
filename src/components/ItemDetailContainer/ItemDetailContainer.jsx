import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById, getProductoById } from "../../services/productsService";
import ItemDetail from "../ItemDetail/ItemDetail";

export default function ItemDetailContainer() {
  const { id } = useParams();
  const routeId = String(id ?? "").trim();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");

      if (!routeId) {
        if (alive) { setError("ID de producto inválido"); setLoading(false); }
        return;
      }

      try {
        const p = (await getProductById(routeId)) ?? (await getProductoById(routeId));
        if (alive) {
          if (!p) setError("Producto no encontrado");
          else setProduct(p);
        }
      } catch (e) {
        console.error("[ItemDetailContainer] fetch error:", e);
        if (alive) setError("No se pudo cargar el producto");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [routeId]);

  if (loading) return <div className="container py-3"><div className="alert alert-secondary">Cargando…</div></div>;
  if (error)   return <div className="container py-3"><div className="alert alert-danger">{error}</div></div>;
  if (!product) return null;

  return <ItemDetail product={product} />;
}
