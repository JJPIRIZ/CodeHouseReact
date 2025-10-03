// Helpers de precio en ARS

export function parsePriceAR(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  // Soporta "$13.000,00", "13000", "13.000,00", etc.
  const s = String(v).trim().replace(/\s+/g, "");
  const normalized = s.replace(/\$/g, "").replace(/\./g, "").replace(/,/g, ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

export function formatARS(v) {
  const n = parsePriceAR(v);
  if (n == null) return "";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}
