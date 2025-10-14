// src/services/uploader.js
// Sube la imagen al PHP sin usar Authorization (evita CORS preflight con error)

function toJpgFileName(id) {
  return `${String(id).trim()}.jpg`;
}

export async function uploadToPhpEndpoint(file, id) {
  const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL;
  const UPLOAD_TOKEN = import.meta.env.VITE_UPLOAD_TOKEN;
  const PUBLIC_BASE = import.meta.env.VITE_PUBLIC_IMAGES_BASE || "";

  if (!UPLOAD_URL) throw new Error("No está configurado VITE_UPLOAD_URL");
  if (!UPLOAD_TOKEN) throw new Error("No está configurado VITE_UPLOAD_TOKEN");

  // Preparamos el form-data
  const form = new FormData();
  form.append("token", UPLOAD_TOKEN);          // <— token como campo, NO header
  form.append("slug", String(id).trim());      // para nombrar el archivo
  form.append("file", file);                   // archivo original (png/jpg/etc)

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    mode: "cors",
    // IMPORTANTE: NO seteamos Content-Type ni Authorization
    body: form,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${t}`);
  }

  const json = await res.json();
  if (!json?.ok) {
    throw new Error(json?.error || "Upload failed");
  }

  // El server guarda SIEMPRE como .jpg => resolvemos la URL final por si la querés mostrar
  const filename = toJpgFileName(id);
  const url = PUBLIC_BASE ? `${PUBLIC_BASE.replace(/\/+$/, "")}/${filename}` : "";
  return { ok: true, filename, url, server: json };
}
