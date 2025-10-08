// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const STORAGE_KEY = "mastecno_cart_v1";

const initialState = {
  items: [], // { id, title, price, image, qty, color?, variant? }
};

function itemKeyOf(p) {
  return [p.id, p.color ?? "", p.variant ?? ""].join("::");
}

// 🔧 Normaliza cualquier producto que venga del catálogo/detalle
function normalizeProductForCart(p = {}) {
  const id = String(p.id ?? "").trim();
  const title = String(p.title ?? p.nombre ?? p.name ?? "").trim();
  const image = String(p.image ?? p.imageUrl ?? "").trim();
  const color = String(p.color ?? "").trim(); // puede venir vacío y está bien
  const variant = String(p.variant ?? "").trim();
  const price = Number(
    typeof p.price === "number" ? p.price :
    typeof p.precioUnitario === "number" ? p.precioUnitario :
    p.price ?? p.precioUnitario ?? 0
  ) || 0;

  // Dejo también alias por compatibilidad, por si la UI usa nombre/imageUrl
  const nombre = title || (p.nombre ?? "");
  const imageUrl = image || (p.imageUrl ?? "");

  return { id, title, price, image, color, variant, nombre, imageUrl };
}

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return action.payload ?? state;

    case "ADD_ITEM": {
      const { product: raw, qty } = action.payload;
      const product = normalizeProductForCart(raw);
      const key = itemKeyOf(product);

      const items = [...state.items];
      const idx = items.findIndex((i) => itemKeyOf(i) === key);
      if (idx >= 0) {
        items[idx] = { ...items[idx], qty: items[idx].qty + qty };
      } else {
        items.push({ ...product, qty });
      }
      return { ...state, items };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => itemKeyOf(i) !== action.payload) };

    case "INCREMENT":
      return {
        ...state,
        items: state.items.map((i) =>
          itemKeyOf(i) === action.payload ? { ...i, qty: i.qty + 1 } : i
        ),
      };

    case "DECREMENT":
      return {
        ...state,
        items: state.items
          .map((i) =>
            itemKeyOf(i) === action.payload ? { ...i, qty: Math.max(1, i.qty - 1) } : i
          )
          .filter((i) => i.qty > 0),
      };

    case "SET_QTY": {
      const { key, qty } = action.payload;
      const n = Math.max(1, Number(qty) || 1);
      return {
        ...state,
        items: state.items.map((i) => (itemKeyOf(i) === key ? { ...i, qty: n } : i)),
      };
    }

    case "CLEAR":
      return { ...state, items: [] };

    default:
      return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items)) {
          // Normalizo por si viene viejo del storage
          const fixed = {
            ...parsed,
            items: parsed.items.map((i) => ({ ...normalizeProductForCart(i), qty: Number(i.qty || 1) })),
          };
          dispatch({ type: "HYDRATE", payload: fixed });
        }
      }
    } catch (err) {
      console.warn("Cart hydrate error", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Cart persist error", err);
    }
  }, [state]);

  const totalItems = useMemo(
    () => state.items.reduce((acc, i) => acc + i.qty, 0),
    [state.items]
  );

  const totalAmount = useMemo(
    () => state.items.reduce((acc, i) => acc + i.qty * Number(i.price || 0), 0),
    [state.items]
  );

  const value = {
    items: state.items,
    totalItems,
    totalAmount,
    addItem: (product, qty = 1) =>
      dispatch({ type: "ADD_ITEM", payload: { product, qty } }),
    removeItem: (product) =>
      dispatch({ type: "REMOVE_ITEM", payload: itemKeyOf(product) }),
    increment: (product) =>
      dispatch({ type: "INCREMENT", payload: itemKeyOf(product) }),
    decrement: (product) =>
      dispatch({ type: "DECREMENT", payload: itemKeyOf(product) }),
    setQty: (product, qty) =>
      dispatch({ type: "SET_QTY", payload: { key: itemKeyOf(product), qty } }),
    clear: () => dispatch({ type: "CLEAR" }),
    itemKeyOf,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext debe usarse dentro de <CartProvider>");
  return ctx;
}
