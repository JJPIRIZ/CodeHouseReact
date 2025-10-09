// src/utils/adminSession.js
const STORAGE_KEY = "admin_session_v1";

/** Guarda/renueva la sesión de admin por N minutos (default 30) */
export function setAdminSession(minutes = 30) {
  const exp = Date.now() + Math.max(1, minutes) * 60 * 1000;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ exp }));
}

/** Si hay sesión válida, extiende su duración (sliding window) */
export function touchAdminSession(minutes = 30) {
  if (isAdminSessionValid()) setAdminSession(minutes);
}

/** ¿La sesión es válida (no expirada)? */
export function isAdminSessionValid() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { exp } = JSON.parse(raw);
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

/** Borra la sesión */
export function clearAdminSession() {
  localStorage.removeItem(STORAGE_KEY);
}
