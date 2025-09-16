import PropTypes from "prop-types";
import ItemDetail from "../ItemDetail/ItemDetail";

export default function ItemListContainer({
  greeting,
  items = [],
  categorias = ["Todas"],
  selectedCategory = "Todas",
  onSelectCategory = () => {},
  sortBy = "price-asc",
  onChangeSort = () => {},
  searchTerm = "",                 // 🔎
  onChangeSearchTerm = () => {},   // 🔎
}) {
  return (
    <>
      {greeting && <h2 className="mb-3">{greeting}</h2>}

      {/* Controles */}
      <div className="row g-2 align-items-end mb-3">
        <div className="col-12 col-lg-4">
          <label className="form-label">Categoría</label>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
          >
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="col-12 col-lg-4">
          <label className="form-label">Ordenar por precio</label>
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => onChangeSort(e.target.value)}
          >
            <option value="price-asc">Menor a mayor</option>
            <option value="price-desc">Mayor a menor</option>
          </select>
        </div>

        {/* 🔎 Buscador */}
        <div className="col-12 col-lg-4">
          <label className="form-label">Buscar producto</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej: Cargador iPhone"
            value={searchTerm}
            onChange={(e) => onChangeSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de productos */}
      <div className="row g-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={item.id}>
              <ItemDetail item={item} />
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-warning">
              No hay productos para la selección/búsqueda actual.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

ItemListContainer.propTypes = {
  greeting: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.object),
  categorias: PropTypes.arrayOf(PropTypes.string),
  selectedCategory: PropTypes.string,
  onSelectCategory: PropTypes.func,
  sortBy: PropTypes.string,
  onChangeSort: PropTypes.func,
  searchTerm: PropTypes.string,                // 🔎
  onChangeSearchTerm: PropTypes.func,          // 🔎
};
