import { getAllSafe, getOne, setOne } from "../firebase";

const COL = "productos";
const BASE = import.meta.env.BASE_URL || "/";

// Para preferredSrc si querés, la UI usa tus utils para hacer fallback real
export function imageFromProductName(name) {
  const safe = encodeURIComponent(String(name ?? "").trim());
  return `${BASE}images/${safe}.jpg`;
}

// ✅ ÚNICA definición
export function getProductHref(pOrId) {
  const id =
    typeof pOrId === "string" || typeof pOrId === "number"
      ? String(pOrId)
      : String(pOrId?.id ?? "");
  if (!id) return "/"; // absoluto
  return `/item/${encodeURIComponent(id)}`; // absoluto → Router agrega basename
}

function normalizeColores(v) {
  if (Array.isArray(v)) return v.filter(Boolean).map((c) => String(c).trim());
  if (v == null) return [];
  return String(v)
    .replace(/[|/;]/g, ",")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function normalizeProduct(p) {
  const coloresArr = normalizeColores(p.colores);
  const out = {
    id: p.id,
    nombre: p.nombre,
    cantidad: Number(p.cantidad ?? 0),
    precioUnitario: Number(p.precioUnitario ?? 0),
    categoria: p.categoria || "",
    colores: coloresArr,
    coloresString: coloresArr.join(", "),
    imageUrl: imageFromProductName(p.nombre),
  };
  // aliases
  out.name = out.nombre;
  out.stock = out.cantidad;
  out.price = out.precioUnitario;
  out.category = out.categoria;
  out.image = out.imageUrl;
  out.colors = out.coloresString;
  return out;
}

// ---------- Lecturas ----------
export async function getProductos({ category = null, limit = null } = {}) {
  const whereEq = [];
  if (category) whereEq.push(["categoria", "==", category]);

  // Si hay filtro por categoría, no ordenamos en server para evitar índice
  const data = await getAllSafe(COL, {
    whereEq,
    order: category ? null : { field: "nombre", dir: "asc" },
    limit,
  });

  return data.map(normalizeProduct);
}

export async function getProductoById(id) {
  const safeId = String(id ?? "").trim();
  if (!safeId) return null;
  const p = await getOne(COL, safeId);
  return p ? normalizeProduct(p) : null;
}

export async function getCategories() {
  const all = await getAllSafe(COL);
  const set = new Set(all.map((p) => p.categoria).filter(Boolean));
  // Devolvemos { id, label } como acordamos con tu NavBar
  return Array.from(set).sort((a, b) => a.localeCompare(b))
    .map((c) => ({ id: c, label: c }));
}

// ---------- Escrituras ----------
export async function upsertProducto({ id, nombre, cantidad, precioUnitario, categoria, colores }) {
  const payload = {
    nombre: String(nombre).trim(),
    cantidad: Number(cantidad ?? 0),
    precioUnitario: Number(precioUnitario ?? 0),
    categoria: String(categoria ?? "").trim(),
    colores: normalizeColores(colores),
  };
  await setOne(COL, id, payload);
}

// ---------- Aliases ----------
export const getProducts = getProductos;
export const getProductById = getProductoById;
export async function getProductsByCategory(category) { return getProductos({ category }); }
export async function getProductosPorCategoria(category) { return getProductos({ category }); }
