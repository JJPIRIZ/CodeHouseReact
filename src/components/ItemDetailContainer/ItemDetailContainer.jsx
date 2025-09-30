import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById } from "../../services/productsService";
import ItemDetail from "../ItemDetail/ItemDetail";

export default function ItemDetailContainer() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const data = await getProductById(id);
        if (alive) setItem(data || null);
      } catch (e) {
        if (alive) setError("No pudimos cargar el producto");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p>Cargando detalle...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!item) return <p>Producto no encontrado.</p>;

  return <ItemDetail item={item} />;
}
