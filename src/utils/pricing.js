// src/utils/pricing.js

export function formatARS(value, opts = {}) {
  const n = Number(value ?? 0);
  const {
    currency = "ARS",
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = opts;
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(n);
  } catch {
    return `$ ${n.toLocaleString("es-AR")}`;
  }
}

export const formatPriceARS = formatARS;
