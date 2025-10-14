# Carrito de compras MasTecno

Aplicación web de e‑commerce para **MasTecno** construida con **React + Vite**. Permite explorar productos, ver detalles, administrar el carrito y finalizar la compra. Está pensada como base didáctica del curso de React, pero es totalmente funcional y extensible.

## 🧩 Características

- Listado de productos con categorías.
- Detalle de producto con variaciones (colores) y stock.
- Carrito persistente (Context API) con sumar/restar/eliminar.
- Buscador y navegación por categorías (React Router).
- UI con **Bootstrap** y estilos personalizados.
- Manejo de estados y notificaciones con **SweetAlert2**.
- Integración de datos/servicios vía **Axios**.
- Estructura modular y lista para escalar.
- Preparada para deploy estático.

## 📦 Instalación

> Asegúrate de tener **Node.js 18+** y **npm** instalados.

```bash
git clone https://github.com/JJPIRIZ/CodeHouseReact.git
cd CoderHouseReact   # si la carpeta clonada se llama CodeHouseReact, usa: cd CodeHouseReact
npm install
npm run dev
```

### Variables de entorno (opcional)
Si utilizás rutas base personalizadas (por ejemplo sirviendo bajo `/MasTecno`), podés configurar un archivo `.env`:

```bash
VITE_BASE_URL=/MasTecno/
```

## 🚀 Scripts disponibles

- `npm run dev` — entorno de desarrollo con Vite.
- `npm run build` — build de producción en `/dist`.
- `npm run preview` — sirve el build localmente para prueba.

## 🛠️ Tecnologías principales

- **React 18**, **Vite**
- **React Router**
- **Context API**
- **Axios**
- **Bootstrap 5**
- **SweetAlert2**
- (Opcional) **React Table / Chart.js** según módulos del proyecto

## 🤝 Contribución

1. Hacé un **fork** del repositorio.
2. Creá una rama: `git checkout -b feature/mi-mejora`.
3. Commit de cambios: `git commit -m "feat: agrego X"`.
4. Push de la rama: `git push origin feature/mi-mejora`.
5. Abrí un **Pull Request** describiendo el cambio y adjuntando capturas si aplica.

> Recomendación: seguí el estilo de commits `conventional commits` (feat, fix, docs, chore…).

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Podés usarlo y modificarlo libremente manteniendo el aviso de licencia.

## 🖼️ Capturas de pantalla / Página principal

Colocá tus capturas en `./docs/` o `./public/` y enlazalas aquí:

- Página principal
- Detalle de producto
- Carrito

> Ejemplo de imagen en Markdown:
>
> ```md
> ![Home](./docs/home.png)
> ```

## 🔗 Enlaces y Contacto

- **Demo / Producción**: https://jjpiriz.com.ar/MasTecno
- **Repo**: https://github.com/JJPIRIZ/CodeHouseReact
- **Autor**: Javier Piriz — [Sitio](https://jjpiriz.com.ar)

---

### Notas
- Si servís la app en un subdirectorio (p. ej. `https://dominio.com/MasTecno`), recordá ajustar correctamente rutas y `import.meta.env.BASE_URL` en Vite.
- Para imágenes de productos, se recomienda nombrarlas sin espacios y con extensión consistente (p. ej. `Tripode-celular.jpg`).

