// src/services/sheetsService.js
import Papa from "papaparse";

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

// ¿Esta fila parece una cabecera aunque esté desplazada?
function isHeaderRow(row) {
  const rn = row.map(norm);
  const hasProducto = rn.some((c) =>
    ["producto", "nombre", "descripcion", "detalle", "articulo"].includes(c)
  );
  const hasCantidad = rn.some((c) =>
    ["cantidad", "stock", "unidades"].includes(c)
  );
  const hasPrecio = rn.some((c) =>
    ["precio", "precio unitario", "importe", "valor"].includes(c)
  );
  const score = (hasProducto ? 1 : 0) + (hasCantidad ? 1 : 0) + (hasPrecio ? 1 : 0);
  return score >= 2;
}

/**
 * Descarga el CSV y retorna meta útil para el servicio de productos.
 * { rows, headerRowIndex, dataStartIndex, headerRow, headerMap }
 */
export async function fetchSheet(csvUrl) {
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  const csvText = await res.text();

  const { data: raw } = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
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

export { norm }; // útil para otros servicios
