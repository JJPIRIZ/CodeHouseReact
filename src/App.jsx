import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar.jsx";
import ItemListContainer from "./components/ItemListContainer/ItemListContainer.jsx";
import ItemDetailContainer from "./components/ItemDetailContainer/ItemDetailContainer.jsx";
import NotFound from "./pages/NotFound.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Contacto from "./pages/Contacto.jsx";
import Cart from "./pages/Cart.jsx";
import AdminImport from "./pages/AdminImport";
import Checkout from "./pages/Checkout";
import AdminOrders from "./pages/AdminOrders";
import AdminHome from "./pages/AdminHome";
import AdminProducts from "./pages/AdminProducts";

export default function App() {
  return (
    <>
      <header>
        <NavBar />
      </header>

      <main className="container py-4">
        <Routes>
          {/* Catálogo completo */}
          <Route path="/" element={<ItemListContainer greeting="Catálogo" />} />

          {/* Catálogo filtrado por categoría */}
          <Route
            path="/category/:categoryId"
            element={<ItemListContainer greeting="Categoría" />}
          />

          {/* Detalle del producto */}
          <Route path="/item/:id" element={<ItemDetailContainer />} />
          
          <Route path="/nosotros" element={<Nosotros />} />
          
          <Route path="/contacto" element={<Contacto />} />

          <Route path="/cart" element={<Cart />} /> 

          <Route path="checkout" element={<Checkout />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/import" element={<AdminImport />} />
          <Route path="/admin/products" element={<AdminProducts />} />

          {/* Redirección opcional */}
          <Route path="/home" element={<Navigate to="/" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
