// App.jsx
import { useEffect, useMemo, useState } from "react";
import NavBar from "./components/NavBar/NavBar";
import ItemListContainer from "./components/ItemListContainer/ItemListContainer";
import { getProductos } from "./service/productosService";

export default function App() {
  const [productos, setProductos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("price-asc");
  const [searchTerm, setSearchTerm] = useState(""); // 🔎

  useEffect(() => {
    (async () => {
      const data = await getProductos();
      setProductos(data);
    })();
  }, []);

  const categorias = useMemo(() => {
    const set = new Set();
    productos.forEach(p => { const c = (p.Categoria || "").trim(); if (c) set.add(c); });
    return ["Todas", ...Array.from(set).sort((a,b)=>a.localeCompare(b))];
  }, [productos]);

  const items = useMemo(() => {
    let list = [...productos];

    // Filtro por categoría
    if (selectedCategory !== "Todas") {
      list = list.filter(p => (p.Categoria || "") === selectedCategory);
    }

    // 🔎 Filtro por texto (en nombre)
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(p => (p._1 || "").toLowerCase().includes(q));
    }

    // Orden
    if (sortBy === "price-asc")  list.sort((a,b) => (a._3||0) - (b._3||0));
    if (sortBy === "price-desc") list.sort((a,b) => (b._3||0) - (a._3||0));

    return list;
  }, [productos, selectedCategory, sortBy, searchTerm]);

  return (
    <>
      <NavBar
        categorias={categorias}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <div className="container py-3">
        <ItemListContainer
          greeting="Productos"
          items={items}
          categorias={categorias}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          sortBy={sortBy}
          onChangeSort={setSortBy}
          searchTerm={searchTerm}                 // 🔎
          onChangeSearchTerm={setSearchTerm}      // 🔎
        />
      </div>
    </>
  );
}
