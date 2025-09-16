// productosService.js
import { fetchSheet } from "./sheetsService";

const CSV_URL =
  import.meta.env?.VITE_SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqN9yW4IYkbLy--Hbp7uYh1fvJXQ1wWjTmW3CimQ__8ecA1F3WaxtcSgc2MByi2kU9iKNBSLwdoexZ/pub?gid=0&single=true&output=csv";

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

const pick = (headerMap, names, fallback) => {
  if (headerMap) {
    for (const n of names) if (Number.isInteger(headerMap[n])) return headerMap[n];
  }
  return fallback;
};

export async function getProductos(url = CSV_URL) {
  const { rows, dataStartIndex, headerMap } = await fetchSheet(url);

  const iId        = pick(headerMap, ["id", "codigo", "cod", "sku"], -1);
  const iNombre    = pick(headerMap, ["_1", "producto", "nombre", "descripcion"], 1);
  const iStock     = pick(headerMap, ["_2", "stock", "cantidad"], 2);
  const iPrecio    = pick(headerMap, ["_3", "precio unitario", "precio", "importe", "valor"], 3);
  const iImagen    = pick(headerMap, ["imagen", "foto", "url"], 4);
  const iCategoria = pick(headerMap, ["categoria", "categoría", "rubro"], 5);

  const start = Number.isInteger(dataStartIndex) ? dataStartIndex : 0;

  const items = rows
    .slice(start)
    .filter((r) => Array.isArray(r) && r.length > Math.max(iNombre, iStock, iPrecio))
    .map((r, idx) => {
      const nombre    = String(r[iNombre] ?? "").trim();
      const stock     = toInt(r[iStock]);
      const precio    = toMoney(r[iPrecio]);
      const imagen    = iImagen >= 0 ? String(r[iImagen] ?? "").trim() : "";
      const categoria = iCategoria >= 0 ? String(r[iCategoria] ?? "").trim() : "";

      let id = iId >= 0 ? String(r[iId] ?? "").trim() : "";
      if (!id) id = `${start + idx + 1}`;

      return { id, _1: nombre, _2: stock, _3: precio, Imagen: imagen, Categoria: categoria };
    })
    .filter((p) => p._1);

  return items;
}
