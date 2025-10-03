// src/components/ItemListContainer/ItemListContainer.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProducts, getProductsByCategory } from "../../services/productsService";
import ItemCard from "../ItemCard/ItemCard";

export default function ItemListContainer() {
  const { categoryId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = categoryId
          ? await getProductsByCategory(categoryId)
          : await getProducts();
        if (alive) setItems(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [categoryId]);

  if (loading) return <p className="text-center py-5">Cargando...</p>;

  return (
    <div className="container py-4">
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
        {items.map((it, i) => (
          <div className="col" key={it?.id ?? i}>
            <ItemCard item={it} />
          </div>
        ))}
      </div>
    </div>
  );
}
