// src/pages/Nosotros.jsx
import React, { useEffect, useState } from "react";
import "./Nosotros.css";

const API_URL = "https://jjpiriz.com.ar/MasTecno/api/listImages.php";

export default function Nosotros() {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL, { cache: "no-store", mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("Lista vacía");
        setImages(data);
      } catch (e) {
        setError(String(e?.message || e));
      }
    })();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setCurrent((prev) => {
          const idxs = images.map((_, i) => i).filter((i) => i !== prev);
          return idxs[Math.floor(Math.random() * idxs.length)];
        });
        setFade(false);
      }, 250);
    }, 6000);
    return () => clearInterval(id);
  }, [images]);

  const imgSrc = images[current];

  return (
    <div className="container my-5">
      <div className="text-center mb-4">
        <h1 className="fw-bold text-primary">Sobre Nosotros</h1>
        <p className="lead text-muted">Tu tienda de tecnología en General Alvear, Mendoza.</p>
      </div>

      <div className="row g-4 align-items-center">
        <div className="col-md-6">
          <div className={`image-frame ${fade ? "fade" : ""}`}>
            {imgSrc ? (
              <img
                key={imgSrc}
                src={imgSrc}
                alt="MasTecno"
                className="image-frame__img"
                onError={(e) => {
                  e.currentTarget.src = "https://jjpiriz.com.ar/MasTecno/images/mastecno.jpg";
                }}
              />
            ) : (
              <div className="p-5 text-center text-muted">
                {error ? `No se pudieron mostrar imágenes: ${error}` : "Cargando…"}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <h3 className="fw-semibold mb-3">MasTecno</h3>
          <p>
            En <strong>MasTecno</strong> creemos que la tecnología debe estar al alcance de todos.
            Por eso trabajamos día a día para ofrecer los mejores productos electrónicos,
            accesorios y artículos para tu hogar, con atención personalizada y precios justos.
          </p>
          <p>
            Somos una empresa de <strong>General Alvear, Mendoza</strong>, con una gran pasión por
            la innovación y el servicio al cliente. Cada compra, cada consulta y cada detalle
            nos importa, porque sabemos que detrás de cada producto hay una persona que confía en nosotros.
          </p>
          <p className="mb-0">
            ¡Gracias por elegirnos! 💙 Seguimos creciendo junto a vos, ofreciendo confianza, calidad y tecnología.
          </p>
        </div>
      </div>
    </div>
  );
}
