// src/services/productosService.js
import { fetchSheet, norm } from "./sheetsService";

const CSV_URL =
  import.meta.env?.VITE_SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqN9yW4IYkbLy--Hbp7uYh1fvJXQ1wWjTmW3CimQ__8ecA1F3WaxtcSgc2MByi2kU9iKNBSLwdoexZ/pub?output=csv";

// Helpers
const toInt = (v) => {
  const s = String(v ?? "").replace(/[^0-9-]/g, "");
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};
const toMoney = (v) => {
  let s = String(v ?? "").replace(/[^0-9,.\-]/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) s = s.replace(/\./g, "").replace(",", ".");
  else if (hasComma && !hasDot) s = s.replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// Busca índice por nombre normalizado
const pick = (headerMap, names, fallback) => {
  if (headerMap) {
    for (const n of names) {
      const idx = headerMap[norm(n)];
      if (Number.isInteger(idx)) return idx;
    }
  }
  return fallback;
};

// Fallback por índices fijos (según tu sheet)
// AHORA incluye Color en la columna 4 (después de Categoría)
function mapRowByFixedIndexes(r, idx, start) {
  const nombre    = String(r[0] ?? "").trim();     // Producto
  const stock     = toInt(r[1]);                   // Cantidad
  const precio    = toMoney(r[2]);                 // Precio Unitario
  const categoria = String(r[3] ?? "").trim();     // Categoria
  const color     = String(r[4] ?? "").trim();     // Color (NUEVO)
  const id = String(start + idx + 1);
  return {
    id,
    _1: nombre,
    _2: stock,
    _3: precio,
    Imagen: "",            // la resolvemos luego por nombre si hace falta
    Categoria: categoria,
    Color: color,          // NUEVO
  };
}

export async function getProductos(url = CSV_URL) {
  try {
    const { rows, dataStartIndex, headerMap } = await fetchSheet(url);

    // Intento 1: mapear usando cabecera detectada
    let iId        = pick(headerMap, ["id", "codigo", "cod", "sku"], -1);
    let iNombre    = pick(headerMap, ["producto", "nombre", "descripcion", "_1"], 0);
    let iStock     = pick(headerMap, ["cantidad", "stock", "unidades", "_2"], 1);
    let iPrecio    = pick(headerMap, ["precio unitario", "precio", "importe", "valor", "_3"], 2);
    let iImagen    = pick(headerMap, ["imagen", "foto", "url"], -1);
    let iCategoria = pick(headerMap, ["categoria", "categoría", "rubro"], 3);
    let iColor     = pick(headerMap, ["color", "colores"], 4); // 👈 NUEVO: lee "Color"

    const start = Number.isInteger(dataStartIndex) ? dataStartIndex : 0;

    let items = rows
      .slice(start)
      .filter((r) => Array.isArray(r) && r.length >= 4)
      .map((r, idx) => {
        const nombre    = String(r[iNombre] ?? "").trim();
        const stock     = toInt(r[iStock]);
        const precio    = toMoney(r[iPrecio]);
        const imagen    = iImagen >= 0 ? String(r[iImagen] ?? "").trim() : "";
        const categoria = iCategoria >= 0 ? String(r[iCategoria] ?? "").trim() : "";
        const color     = iColor >= 0 ? String(r[iColor] ?? "").trim() : ""; // 👈 NUEVO

        let id = iId >= 0 ? String(r[iId] ?? "").trim() : "";
        if (!id) id = String(start + idx + 1);

        return {
          id,
          _1: nombre,
          _2: stock,
          _3: precio,
          Imagen: imagen,
          Categoria: categoria,
          Color: color, // 👈 NUEVO
        };
      })
      .filter((p) => p._1);
      // DEBUG rápido
if (items.length) {
  console.log("[productos] count:", items.length);
  console.log("[productos] sample:", items[0]);
} else {
  console.warn("[productos] vacío");
}

    // Intento 2: si no salió nada, forzar por índices fijos (según tu sheet)
    if (items.length === 0) {
      items = rows
        .slice(start)
        .filter((r) => Array.isArray(r) && r.length >= 4)
        .map((r, idx) => mapRowByFixedIndexes(r, idx, start))
        .filter((p) => p._1);
    }

    // Alias normalizados para el front:
    // nombre, precio, imagen, categoria, color (sin romper las claves previas)
    items = items.map((p) => ({
      ...p,
      nombre: p._1,
      precio: p._3,
      imagen: p.Imagen,
      categoria: p.Categoria,
      color: p.Color || "", // 👈 usado por ItemCard / ItemDetail
    }));

    return items;
  } catch (e) {
    console.error("[sheets] error getProductos:", e);
    return [];
  }
}
