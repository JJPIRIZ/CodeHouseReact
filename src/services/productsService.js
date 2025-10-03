import { getProductos } from "./productosService";

export const slugify = (s) =>
  String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const toNumberARS = (v) => {
  if (v == null) return null;
  let s = String(v).trim();
  s = s.replace(/\$/g, "").replace(/\s/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const normalizeRow = (r) => {
  const nombre = (r && (r._1 ?? r["Producto"] ?? r.Producto ?? r.nombre ?? r.Nombre)) || "";
  const stock  = r?._2 ?? r?.Cantidad ?? r?.cantidad ?? null;
  const precio = toNumberARS(r?._3 ?? r?.["Precio Unitario"] ?? r?.precio);
  const categoria = (r && (r.Categoria ?? r.categoria)) || "";
  const colores   = (r && (r.Color ?? r.Colores ?? r.colores)) || "";
  const imagen    = ((r && (r.Imagen ?? r.imagen)) || "").trim() || null;

  return {
    id: String(r?.id ?? `${Date.now()}-${Math.random()}`),
    nombre: String(nombre).trim() || "Producto sin nombre",
    stock: stock != null ? Number(stock) : null,
    precio,
    categoria: String(categoria).trim(),
    categoriaId: slugify(categoria),
    colores: String(colores).trim(),
    imagen,
    _raw: r,
  };
};

const normalizeAll = (rows) => (Array.isArray(rows) ? rows.map(normalizeRow) : []);

export async function getProducts() {
  const raw = await getProductos();
  const normalized = normalizeAll(raw);
  return normalized;
}

// Busca por id exacto, por slug del nombre, o por SKU/Codigo del raw.
export async function getProductById(idOrSlug) {
  const all = await getProducts();
  const needle = decodeURIComponent(String(idOrSlug ?? "")).trim();

  let found = all.find((p) => String(p.id) === needle);
  if (found) return found;

  const nslug = slugify(needle);
  found = all.find((p) => slugify(p.nombre) === nslug);
  if (found) return found;

  found = all.find((p) => {
    const sku = p?._raw?.SKU ?? p?._raw?.Cod ?? p?._raw?.Codigo ?? p?._raw?.codigo;
    return sku && String(sku).trim() === needle;
  });

  return found ?? null;
}

// Link al detalle: usa id si es “limpio”; si no, slug del nombre
export function getProductHref(p) {
  const hasStableId = p?.id && !String(p.id).includes("-");
  return `/item/${hasStableId ? String(p.id) : slugify(p?.nombre ?? "")}`;
}

export async function getProductsByCategory(categoryId) {
  const all = await getProducts();
  if (!categoryId) return all;
  const slug = String(categoryId).toLowerCase();
  return all.filter((p) => p.categoriaId === slug);
}

export async function getCategories() {
  const all = await getProducts();
  const map = new Map();
  all.forEach((p) => {
    if (!p.categoriaId) return;
    if (!map.has(p.categoriaId)) {
      map.set(p.categoriaId, { id: p.categoriaId, label: p.categoria || p.categoriaId });
    }
  });
  return Array.from(map.values());
}
