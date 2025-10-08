// src/pages/AdminImport.jsx
import { useMemo, useState } from "react";
import { batchUpsert } from "../firebase";
import { fetchProductosFromSheet } from "../services/sheetsService";

// --- Helpers robustos para normalizar ---
function slug(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value) {
  if (value == null) return 0;
  let s = String(value).trim();
  // dejar solo dígitos, coma, punto, signo
  s = s.replace(/[^\d,.\-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function normalizeColores(v) {
  if (Array.isArray(v)) return v.filter(Boolean).map((c) => String(c).trim());
  if (v == null) return [];
  return String(v)
    .replace(/[|/;]/g, ",")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export default function AdminImport() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState([]);
  const [csvUrl, setCsvUrl] = useState(import.meta.env.VITE_SHEET_CSV_URL || "");

  const normalized = useMemo(
    () =>
      preview.map((p) => ({
        id: slug(p.nombre), // ← ID estable por nombre (upsert real)
        nombre: String(p.nombre ?? "").trim(),
        cantidad: Number(p.cantidad ?? 0),
        precioUnitario: toNumber(p.precioUnitario),
        categoria: String(p.categoria ?? "").trim(),
        colores: normalizeColores(p.colores),
      })),
    [preview]
  );

  const zeroPriceCount = useMemo(
    () => normalized.filter((p) => Number(p.precioUnitario) === 0).length,
    [normalized]
  );

  const cargarPreview = async () => {
    setStatus("loading");
    setError("");
    try {
      const rows = await fetchProductosFromSheet(csvUrl);
      setPreview(rows);
      setStatus("ready");
    } catch (e) {
      setError(e?.message || "No se pudo leer el Sheet");
      setStatus("idle");
    }
  };

  const importar = async () => {
    if (!normalized.length) {
      setError("No hay datos para importar. Cargá el preview primero.");
      return;
    }
    if (
      !confirm(
        `Vas a importar ${normalized.length} productos a Firestore (se sobrescriben por nombre). ¿Continuar?`
      )
    )
      return;

    setStatus("importing");
    setError("");
    try {
      // 👇 upsert por id (slug nombre) —> pisa docs previos (incluidos los que tenían precio 0)
      await batchUpsert("productos", normalized, "id");
      setStatus("done");
    } catch (e) {
      setError(e?.message || "Falló la importación (¿reglas de Firestore?)");
      setStatus("ready");
    }
  };

  return (
    <div className="container py-4">
      <h1 className="mb-3">Importar productos (Sheet → Firestore)</h1>

      <div className="card p-3 mb-3">
        <h5 className="mb-2">Paso 1: URL del CSV publicado</h5>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
          value={csvUrl}
          onChange={(e) => setCsvUrl(e.target.value)}
        />
        <button
          className="btn btn-outline-primary"
          disabled={status === "loading" || !csvUrl}
          onClick={cargarPreview}
        >
          {status === "loading" ? "Cargando..." : "Cargar preview"}
        </button>
        {error && <p className="text-danger mt-2">{error}</p>}
      </div>

      {normalized.length > 0 && (
        <div className="card p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-2">Preview normalizado ({normalized.length} productos)</h5>
            <span className="badge text-bg-warning">
              Precios en 0: {zeroPriceCount}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th>ID (slug)</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario (num)</th>
                  <th>Categoría</th>
                  <th>Colores</th>
                </tr>
              </thead>
              <tbody>
                {normalized.slice(0, 50).map((p) => (
                  <tr key={p.id} className={Number(p.precioUnitario) === 0 ? "table-warning" : ""}>
                    <td>{p.id}</td>
                    <td>{p.nombre}</td>
                    <td>{p.cantidad}</td>
                    <td>{p.precioUnitario}</td>
                    <td>{p.categoria}</td>
                    <td>{Array.isArray(p.colores) ? p.colores.join(", ") : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {normalized.length > 50 && (
            <div className="small text-muted">Mostrando 50 de {normalized.length}…</div>
          )}
        </div>
      )}

      <div className="card p-3">
        <h5 className="mb-2">Paso 2: Importar a Firestore</h5>
        <button
          className="btn btn-success"
          onClick={importar}
          disabled={status === "importing" || normalized.length === 0}
        >
          {status === "importing" ? "Importando…" : "Importar ahora"}
        </button>

        {status === "done" && (
          <div className="alert alert-success mt-3">
            ¡Listo! Productos importados/actualizados por <code>id = slug(nombre)</code>.
          </div>
        )}
      </div>
    </div>
  );
}
