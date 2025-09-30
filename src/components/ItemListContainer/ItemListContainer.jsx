import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getProducts,
  getProductsByCategory,
} from "../../services/productsService";
import ItemCard from "../ItemCard/ItemCard";

export default function ItemListContainer({ greeting }) {
  const { categoryId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const data = categoryId
          ? await getProductsByCategory(categoryId)
          : await getProducts();
        if (alive) setItems(data);
        // DEBUG opcional:
        // console.log("[debug] categoryId:", categoryId, "items:", data);
      } catch (e) {
        if (alive) setError("No pudimos cargar los productos");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [categoryId]);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <>
      <h1 className="mb-4">{greeting}</h1>
      {categoryId && (
        <p className="text-secondary">
          Filtrando por: <strong>{categoryId}</strong>
        </p>
      )}

      {items.length === 0 ? (
        <p>No hay productos para esta categoría.</p>
      ) : (
        <div className="row g-3">
          {items.map((prod) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={prod.id}>
              <ItemCard item={prod} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
