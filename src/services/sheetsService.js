// src/services/sheetsService.js
import Papa from "papaparse";

export const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const simplify = (s) => norm(s).replace(/[^a-z0-9]/g, "");

// ¿Esta fila parece una cabecera aunque esté desplazada?
function isHeaderRow(row) {
  const rn = row.map(norm);
  const hasProducto = rn.some((c) =>
    ["producto", "nombre", "descripcion", "detalle", "articulo", "item"].includes(c)
  );
  const hasCantidad = rn.some((c) => ["cantidad", "stock", "unidades", "cant"].includes(c));
  const hasPrecio = rn.some((c) =>
    ["precio", "precio unitario", "preciounitario", "valor", "importe", "pu", "p.u."].includes(c)
  );
  const score = (hasProducto ? 1 : 0) + (hasCantidad ? 1 : 0) + (hasPrecio ? 1 : 0);
  return score >= 2;
}

/** Descarga el CSV y retorna meta útil */
export async function fetchSheet(csvUrl) {
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  const csvText = await res.text();

  const { data: raw } = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
    // delimiter: auto (por defecto) — Papa detecta , ; \t
  });

  const rows = Array.isArray(raw) ? raw : [];
  const clean = rows.filter(
    (r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== "")
  );

  let headerRowIndex = -1;
  for (let i = 0; i < clean.length; i++) {
    if (isHeaderRow(clean[i])) {
      headerRowIndex = i;
      break;
    }
  }
  const dataStartIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
  const headerRow = headerRowIndex >= 0 ? clean[headerRowIndex] : null;

  const headerMap = {};
  if (headerRow) {
    headerRow.forEach((h, i) => {
      const key = norm(h) || `col_${i}`;
      headerMap[key] = i;
    });
  }

  return { rows: clean, headerRowIndex, dataStartIndex, headerRow, headerMap };
}

function resolveHeaderIndex(meta, candidates = []) {
  const { headerRow, headerMap } = meta;
  if (!headerRow) return -1;

  const candNorms = candidates.map(norm);
  const candSims = candidates.map(simplify);

  // 1) match exacto normalizado
  for (const c of candNorms) {
    if (c in headerMap) return headerMap[c];
  }

  // 2) match difuso
  for (let i = 0; i < headerRow.length; i++) {
    const hSim = simplify(headerRow[i]);
    if (candSims.includes(hSim)) return i;
    if (
      (candSims.includes("preciounitario") &&
        /^(p\.?u\.?|preciounitario|preciounit|preciou)$/.test(hSim)) ||
      (candSims.includes("precio") && /^precio/.test(hSim))
    ) {
      return i;
    }
  }
  return -1;
}

function toNumber(value) {
  if (value == null) return 0;
  let s = String(value).trim();
  // quitar todo excepto dígitos, coma, punto, signo
  s = s.replace(/[^\d,.\-]/g, "");

  if (s.includes(",") && s.includes(".")) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      // 1.234,56 → 1234.56
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // 1,234.56 → 1234.56
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    // solo coma → decimal
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function splitColores(v) {
  if (!v) return [];
  return String(v)
    .replace(/[|/;]/g, ",")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Escanea toda la fila por un "texto de precio" si la celda oficial falla */
function findPriceInRow(row, preferIdx = -1, qtyIdx = -1) {
  // 1) Intento directo por la posición detectada
  if (preferIdx >= 0) {
    const n = toNumber(row[preferIdx]);
    if (n > 0) return n;
  }

  // 2) Scan de celdas que "parecen precio" (tienen $ , . )
  for (let i = 0; i < row.length; i++) {
    if (i === qtyIdx) continue; // saltar cantidad
    const cell = row[i];
    const s = String(cell ?? "");
    if (!/[0-9]/.test(s)) continue;
    if (!/[$,\.]/.test(s)) continue; // si no tiene separadores/moneda, suele ser cantidad u otro número
    const n = toNumber(s);
    if (n > 0) return n;
  }

  // 3) Último intento: cualquier número > 0 salvo cantidad exacta
  for (let i = 0; i < row.length; i++) {
    if (i === qtyIdx) continue;
    const n = toNumber(row[i]);
    if (n > 0) return n;
  }

  return 0;
}

/** Transforma filas → { nombre, cantidad, precioUnitario, categoria, colores[] } */
function rowsToProductos(meta) {
  const { rows, dataStartIndex } = meta;

  const idxProducto = resolveHeaderIndex(meta, [
    "producto",
    "nombre",
    "descripcion",
    "detalle",
    "articulo",
    "item",
  ]);
  const idxCantidad = resolveHeaderIndex(meta, ["cantidad", "stock", "unidades", "cant"]);
  const idxPrecio = resolveHeaderIndex(meta, [
    "precio unitario",
    "precio",
    "preciounitario",
    "p.u.",
    "pu",
    "valor",
    "importe",
  ]);
  const idxCategoria = resolveHeaderIndex(meta, ["categoria", "rubro", "familia"]);
  const idxColores = resolveHeaderIndex(meta, ["colores", "color", "variantes", "colores disponibles"]);

  const out = [];
  for (let i = dataStartIndex; i < rows.length; i++) {
    const r = rows[i] || [];
    const nombre = idxProducto >= 0 ? r[idxProducto] : r[0];
    if (!String(nombre ?? "").trim()) continue;

    const cantidad = idxCantidad >= 0 ? toNumber(r[idxCantidad]) : 0;

    // precio por celda → si falla, scan de fila completa
    let precioUnitario = idxPrecio >= 0 ? toNumber(r[idxPrecio]) : 0;
    if (!precioUnitario || precioUnitario <= 0) {
      precioUnitario = findPriceInRow(r, idxPrecio, idxCantidad);
    }

    const categoria = idxCategoria >= 0 ? String(r[idxCategoria] ?? "").trim() : "";
    const colores = idxColores >= 0 ? splitColores(r[idxColores]) : [];

    out.push({
      nombre: String(nombre).trim(),
      cantidad,
      precioUnitario,
      categoria,
      colores,
    });
  }

  return out;
}

export async function fetchProductosFromSheet(url = import.meta.env.VITE_SHEET_CSV_URL) {
  if (!url) throw new Error("Falta VITE_SHEET_CSV_URL en .env o no se pasó url al llamar.");
  const meta = await fetchSheet(url);
  return rowsToProductos(meta);
}
