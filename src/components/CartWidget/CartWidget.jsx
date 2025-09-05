import { FaShoppingCart } from "react-icons/fa";
import "./CartWidget.css";

export default function CartWidget() {
  const cantidad = 3; // ejemplo, luego podés reemplazarlo con estado

  return (
    <a href="#" className="btn btn-outline-light position-relative cart-btn">
      <FaShoppingCart size={18} />
      {cantidad > 0 && (
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {cantidad}
        </span>
      )}
    </a>
  );
}
