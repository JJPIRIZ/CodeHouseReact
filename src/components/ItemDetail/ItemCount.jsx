import { useState } from "react";

export default function ItemCount({ stock = 0, initial = 1, onAdd }) {
  const [count, setCount] = useState(initial);

  const inc = () => setCount((c) => (c < stock ? c + 1 : c));
  const dec = () => setCount((c) => (c > 1 ? c - 1 : c));

  return (
    <div className="d-flex align-items-center gap-2 mt-3">
      <button
        className="btn btn-outline-secondary"
        onClick={dec}
        disabled={count <= 1}
      >
        -
      </button>
      <span className="px-3">{count}</span>
      <button
        className="btn btn-outline-secondary"
        onClick={inc}
        disabled={count >= stock}
      >
        +
      </button>
      <button
        className="btn btn-primary ms-3"
        onClick={() => onAdd(count)}
        disabled={stock === 0}
      >
        Agregar al carrito
      </button>
    </div>
  );
}
