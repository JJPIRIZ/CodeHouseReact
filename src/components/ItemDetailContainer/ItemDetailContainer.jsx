import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProductById } from "../../services/productsService";
import ItemDetail from "../ItemDetail/ItemDetail";

export default function ItemDetailContainer() {
  const { idOrSlug } = useParams(); // ⬅️ el nombre debe coincidir con la ruta
  const [producto, setProducto] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getProductById(idOrSlug);
        if (alive) {
          setProducto(p);
          setStatus("ready");
        }
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => { alive = false; };
  }, [idOrSlug]);

  if (status === "loading") return <div className="container py-4">Cargando…</div>;
  if (!producto) return <div className="container py-4">Producto no encontrado.</div>;

  return (
    <div className="container py-4">
      <ItemDetail producto={producto} />
    </div>
  );
}
