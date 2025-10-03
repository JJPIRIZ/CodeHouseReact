export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export const toInt = (v, def = 0) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : def;
};
