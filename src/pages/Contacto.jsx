import React, { useState } from "react";
import "./Contacto.css";

const WHATSAPP_NUMBER = "549262515404051"; // Argentina: 54 + 9 + número sin símbolos

export default function Contacto() {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  });
  const [copiado, setCopiado] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const buildHtml = () => {
    const { nombre, telefono, asunto, mensaje } = form;
    const fecha = new Date().toLocaleString();
    return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Consulta desde MasTecno</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;padding:20px;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width:640px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e9eef6;">
    <tr>
      <td style="background:#2a5298;color:#fff;padding:16px 20px;font-size:18px;font-weight:bold;">
        Nueva consulta — MasTecno
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <p style="margin:0 0 12px 0;"><strong>Fecha:</strong> ${fecha}</p>
        <p style="margin:0 0 12px 0;"><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p style="margin:0 0 12px 0;"><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
        <p style="margin:0 0 12px 0;"><strong>Asunto:</strong> ${escapeHtml(asunto)}</p>
        <div style="margin-top:16px;padding:12px;background:#f7fafc;border-radius:10px;border:1px solid #e6eef8;">
          <div style="font-weight:bold;margin-bottom:6px;">Mensaje:</div>
          <div style="white-space:pre-wrap;line-height:1.5;">${escapeHtml(mensaje)}</div>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 20px;color:#667085;font-size:12px;background:#fbfdff;border-top:1px solid #e9eef6;">
        Dirección: Callejón Franco 235, General Alvear, Mendoza — Enviado desde el formulario web.
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  // Pequeña utilidad para evitar inyectar HTML
  const escapeHtml = (str) =>
    String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const toWhatsappText = () => {
    const { nombre, telefono, asunto, mensaje } = form;
    return [
      "🆕 *Nueva consulta desde la web*",
      "",
      `👤 *Nombre*: ${nombre || "-"}`,
      `📞 *Teléfono*: ${telefono || "-"}`,
      `📝 *Asunto*: ${asunto || "-"}`,
      "",
      "💬 *Mensaje*:",
      (mensaje || "-"),
      "",
      "📍 Callejón Franco 235, General Alvear, Mendoza",
    ].join("\n");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1) Copia el HTML al portapapeles
    try {
      await navigator.clipboard.writeText(buildHtml());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3500);
    } catch {
      // Si el navegador no permite copiar, no frenamos el flujo
    }

    // 2) Abre WhatsApp con el mensaje de texto
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      toWhatsappText()
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="container my-5">
      <h1 className="text-center text-primary fw-bold mb-4">Contáctanos</h1>

      <div className="row g-4">
        {/* Formulario */}
        <div className="col-md-6">
          <form className="p-4 rounded shadow bg-light" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="nombre" className="form-label">Nombre</label>
              <input name="nombre" id="nombre" className="form-control" placeholder="Tu nombre"
                value={form.nombre} onChange={onChange} required />
            </div>
            <div className="mb-3">
              <label htmlFor="telefono" className="form-label">Teléfono</label>
              <input name="telefono" id="telefono" className="form-control" placeholder="Tu teléfono"
                value={form.telefono} onChange={onChange} required />
            </div>
            <div className="mb-3">
              <label htmlFor="asunto" className="form-label">Asunto</label>
              <input name="asunto" id="asunto" className="form-control" placeholder="Ej: Consulta por auriculares"
                value={form.asunto} onChange={onChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="mensaje" className="form-label">Mensaje</label>
              <textarea name="mensaje" id="mensaje" rows="4" className="form-control"
                placeholder="Contanos en qué te podemos ayudar..." value={form.mensaje} onChange={onChange} required />
            </div>

            <button type="submit" className="btn btn-success w-100">
              Enviar por WhatsApp
            </button>

            {copiado && (
              <div className="alert alert-info mt-3 mb-0" role="alert">
                ✨ El mensaje HTML se copió al portapapeles. Podés pegarlo donde necesites.
              </div>
            )}
          </form>
        </div>

        {/* Mapa y contacto */}
        <div className="col-md-6">
          <div className="p-4 rounded shadow bg-light">
            <h5 className="fw-bold mb-3">Nuestra ubicación</h5>
            <iframe
              title="Mapa MasTecno"
              src="https://www.google.com/maps?q=Callejon+Franco+235+General+Alvear+Mendoza&output=embed"
              width="100%"
              height="250"
              style={{ border: 0, borderRadius: "10px" }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>

            <div className="mt-4">
              <p className="mb-1"><strong>Dirección:</strong> Callejón Franco 235, General Alvear, Mendoza</p>
              <p className="mb-1">
                <strong>WhatsApp:</strong>{" "}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-success fw-semibold"
                >
                  +54 9 2625 15404051
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
