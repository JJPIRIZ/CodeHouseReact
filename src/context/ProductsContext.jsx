import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProductos } from "../services/productosService";

const ProductsContext = createContext(null);

export function useProducts(optional = false) {
  const ctx = useContext(ProductsContext);
  if (!ctx && !optional) throw new Error("useProducts debe usarse dentro de <ProductsProvider>");
  return ctx;
}

export function ProductsProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros UI
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("price-asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getProductos();
        setProductos(Array.isArray(data) ? data : []);
        setError("");
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categorias = useMemo(() => {
    const set = new Set();
    productos.forEach(p => {
      const c = (p.Categoria || "").trim();
      if (c) set.add(c);
    });
    return ["Todas", ...Array.from(set).sort((a,b)=>a.localeCompare(b))];
  }, [productos]);

  const items = useMemo(() => {
    let list = [...productos];

    if (selectedCategory !== "Todas") {
      list = list.filter(p => (p.Categoria || "") === selectedCategory);
    }

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(p => (p._1 || "").toLowerCase().includes(q));
    }

    if (sortBy === "price-asc")  list.sort((a,b) => (a._3||0) - (b._3||0));
    if (sortBy === "price-desc") list.sort((a,b) => (b._3||0) - (a._3||0));

    return list;
  }, [productos, selectedCategory, sortBy, searchTerm]);

  const value = {
    productos, categorias, items, loading, error,
    selectedCategory, setSelectedCategory,
    sortBy, setSortBy,
    searchTerm, setSearchTerm,
    refresh: async () => {
      const data = await getProductos();
      setProductos(Array.isArray(data) ? data : []);
    }
  };

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}
