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
  // Si tiene al menos 2 de los 3, la tratamos como cabecera
  const score = (hasProducto ? 1 : 0) + (hasCantidad ? 1 : 0) + (hasPrecio ? 1 : 0);
  return score >= 2;
}

/**
 * Descarga el CSV y retorna meta util para el servicio de productos.
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

  // Detectar cabecera (puede estar en la fila 1 si la 0 es un título centrado)
  let headerRowIndex = -1;
  for (let i = 0; i < clean.length; i++) {
    if (isHeaderRow(clean[i])) {
      headerRowIndex = i;
      break;
    }
  }
  const dataStartIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
  const headerRow = headerRowIndex >= 0 ? clean[headerRowIndex] : null;

  // headerMap: nombre normalizado → índice
  const headerMap = {};
  if (headerRow) {
    headerRow.forEach((h, i) => {
      const key = norm(h) || `col_${i}`;
      headerMap[key] = i;
    });
  }

  // 🔎 LOGS de depuración
  // console.groupCollapsed("[sheetsService] Debug CSV");
  // console.log("Total filas (raw):", rows.length);
  // console.log("Primeras 5 filas (clean):", clean.slice(0, 5));
  // console.log("headerRowIndex:", headerRowIndex);
  // console.log("dataStartIndex:", dataStartIndex);
  // console.log("headerRow:", headerRow);
  // console.log("headerMap:", headerMap);
  // console.log("Muestra de datos (2 filas):", clean.slice(dataStartIndex, dataStartIndex + 2));
  // console.groupEnd();

  return { rows: clean, headerRowIndex, dataStartIndex, headerRow, headerMap };
}
