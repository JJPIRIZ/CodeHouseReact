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

// 👇 NUEVO: fallback robusto si no detecta cabecera o si no hay datos
function mapRowByFixedIndexes(r, idx, start) {
  const nombre    = String(r[0] ?? "").trim();          // Producto
  const stock     = toInt(r[1]);                        // Cantidad
  const precio    = toMoney(r[2]);                      // Precio Unitario
  const categoria = String(r[3] ?? "").trim();          // Categoria
  const id = String(start + idx + 1);
  return {
    id,
    _1: nombre,
    _2: stock,
    _3: precio,
    Imagen: "",            // la resolvemos luego por nombre de producto
    Categoria: categoria,
  };
}

export async function getProductos(url = CSV_URL) {
  try {
    const { rows, dataStartIndex, headerMap } = await fetchSheet(url);

    // DEBUG
    // console.log("[sheets] headerMap:", headerMap);
    // console.log("[sheets] dataStartIndex:", dataStartIndex);
    // console.log("[sheets] sample rows:", rows.slice(dataStartIndex, dataStartIndex + 3));

    // Intento 1: mapear usando cabecera detectada
    let iId        = pick(headerMap, ["id", "codigo", "cod", "sku"], -1);
    let iNombre    = pick(headerMap, ["producto", "nombre", "descripcion", "_1"], 0);
    let iStock     = pick(headerMap, ["cantidad", "stock", "unidades", "_2"], 1);
    let iPrecio    = pick(headerMap, ["precio unitario", "precio", "importe", "valor", "_3"], 2);
    let iImagen    = pick(headerMap, ["imagen", "foto", "url"], -1);
    let iCategoria = pick(headerMap, ["categoria", "categoría", "rubro"], 3);

    const start = Number.isInteger(dataStartIndex) ? dataStartIndex : 0;

    let items = rows
      .slice(start)
      .filter((r) => Array.isArray(r) && r.length >= 4) // esperamos al menos 4 cols
      .map((r, idx) => {
        const nombre    = String(r[iNombre] ?? "").trim();
        const stock     = toInt(r[iStock]);
        const precio    = toMoney(r[iPrecio]);
        const imagen    = iImagen >= 0 ? String(r[iImagen] ?? "").trim() : "";
        const categoria = iCategoria >= 0 ? String(r[iCategoria] ?? "").trim() : "";

        let id = iId >= 0 ? String(r[iId] ?? "").trim() : "";
        if (!id) id = String(start + idx + 1);

        return { id, _1: nombre, _2: stock, _3: precio, Imagen: imagen, Categoria: categoria };
      })
      .filter((p) => p._1);

    // Intento 2: si no salió nada, forzar por índices fijos (según tu sheet)
    if (items.length === 0) {
      // console.warn("[sheets] fallback por índices fijos");
      items = rows
        .slice(start)
        .filter((r) => Array.isArray(r) && r.length >= 4)
        .map((r, idx) => mapRowByFixedIndexes(r, idx, start))
        .filter((p) => p._1);
    }

    // DEBUG
    // console.log("[sheets] productos (primeros 3):", items.slice(0, 3));
    return items;
  } catch (e) {
    console.error("[sheets] error getProductos:", e);
    return [];
  }
}
