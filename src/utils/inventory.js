// Helpers de stock

export function stockBadgeVariant(q) {
  if (q <= 0) return "danger";   // rojo
  if (q <= 2) return "warning";  // amarillo
  return "success";              // verde
}

export function getStock(p) {
  const stockRaw =
    p?.stock ?? p?.Stock ?? p?.cantidad ?? p?.Cantidad ??
    p?.disponible ?? p?.Disponible ?? p?.inventory ?? p?.Inventory ?? 0;
  return Number(stockRaw) || 0;
}
