// src/services/productsService.js
import { getProductos } from "./productosService";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function imageFromProductName(name) {
  const safe = encodeURIComponent(String(name ?? "").trim());
  return `${import.meta.env.BASE_URL}images/${safe}.jpg`;
}

function mapRowToItem(row) {
  const title = String(row._1 ?? "Producto").trim();
  const price = Number(row._3 ?? 0);
  const rawCat = String(row.Categoria ?? "general").trim();

  const category = rawCat.toLowerCase(); // URL param
  const pictureUrl =
    row.Imagen && String(row.Imagen).trim()
      ? String(row.Imagen).trim()
      : imageFromProductName(title);

  return {
    id: String(row.id ?? ""),
    title,
    description: "", // tu sheet no trae descripción
    price,
    category,
    pictureUrl,
    categoryLabel: rawCat, // por si querés mostrar con mayúsculas en el menú
  };
}

export async function getProducts() {
  await delay(400);
  const rows = await getProductos();
  return rows.map(mapRowToItem).filter((p) => p.id && p.title);
}

export async function getProductsByCategory(category) {
  await delay(200);
  const all = await getProducts();
  const cat = String(category).toLowerCase();
  return all.filter((p) => p.category === cat);
}

export async function getProductById(id) {
  await delay(200);
  const all = await getProducts();
  const target = String(id);
  return all.find((p) => String(p.id) === target);
}
