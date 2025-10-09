// src/services/ordersService.js
import { db } from "../firebase";
import {
  doc,
  collection,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getAllSafe, setOne } from "../firebase";

// ---------- Normalizadores ----------
function normalizeCartItem(p) {
  const id = String(p.id ?? "").trim();
  const title = String(p.title ?? p.nombre ?? p.name ?? "").trim();
  const price = Number(
    typeof p.price === "number"
      ? p.price
      : typeof p.precioUnitario === "number"
      ? p.precioUnitario
      : p.price ?? p.precioUnitario ?? 0
  ) || 0;
  const qty = Math.max(1, Number(p.qty || 1));
  const color = p.color ? String(p.color).trim() : null;

  return { id, title, price, qty, color, subtotal: price * qty };
}

function tsToDateMaybe(ts) {
  try {
    if (!ts) return null;
    if (typeof ts.toDate === "function") return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
  } catch {}
  return null;
}

function normalizeOrder(docObj) {
  const o = { ...docObj };
  const createdAt = tsToDateMaybe(o.createdAt);
  const updatedAt = tsToDateMaybe(o.updatedAt);
  return {
    id: o.id,
    buyer: {
      name: String(o?.buyer?.name ?? ""),
      phone: String(o?.buyer?.phone ?? ""),
      email: String(o?.buyer?.email ?? ""),
    },
    items: Array.isArray(o.items) ? o.items.map(normalizeCartItem) : [],
    total: Number(o.total ?? 0),
    status: String(o.status ?? "created"),
    createdAt,
    updatedAt,
    createdAtTS: o.createdAt ?? null,
    updatedAtTS: o.updatedAt ?? null,
  };
}

// ---------- Crear orden + descontar stock (transacción) ----------
export async function createOrderAndDecrementStock({ items, buyer }) {
  const normalized = (items || []).map(normalizeCartItem);
  if (normalized.length === 0) throw new Error("No hay items en el carrito");
  const total = normalized.reduce((acc, it) => acc + it.subtotal, 0);

  // sumar por id (sin distinguir color) para chequear stock por producto
  const qtyById = new Map();
  for (const it of normalized) {
    if (!it.id) throw new Error("Un item no tiene id válido.");
    qtyById.set(it.id, (qtyById.get(it.id) ?? 0) + it.qty);
  }

  const orderRef = doc(collection(db, "orders"));

  await runTransaction(db, async (tx) => {
    // 1) Lecturas
    const prodIds = Array.from(qtyById.keys());
    const prodRefs = prodIds.map((id) => doc(db, "productos", id));
    const snaps = await Promise.all(prodRefs.map((ref) => tx.get(ref)));

    const updates = [];
    for (let i = 0; i < snaps.length; i++) {
      const snap = snaps[i];
      const id = prodIds[i];
      if (!snap.exists()) throw new Error(`El producto con id "${id}" ya no existe.`);
      const data = snap.data();
      const current = Number(data?.cantidad ?? 0);
      const required = qtyById.get(id) ?? 0;
      if (current < required) {
        const title = String(data?.nombre ?? data?.name ?? id);
        throw new Error(`Stock insuficiente para "${title}". Disponible: ${current}, pedido: ${required}`);
      }
      updates.push({ ref: prodRefs[i], next: current - required });
    }

    // 2) Escrituras
    for (const u of updates) {
      tx.update(u.ref, { cantidad: u.next, updatedAt: serverTimestamp() });
    }
    tx.set(orderRef, {
      buyer: {
        name: String(buyer?.name ?? "").trim(),
        phone: String(buyer?.phone ?? "").trim(),
        email: String(buyer?.email ?? "").trim(),
      },
      items: normalized,
      total,
      status: "created",
      createdAt: serverTimestamp(),
    });
  });

  return { orderId: orderRef.id, total };
}

// ---------- Admin: listar / actualizar ----------
export async function getOrders() {
  // Para evitar pedir índices, traemos todo y ordenamos en cliente
  const raw = await getAllSafe("orders");
  const list = raw.map((d) => normalizeOrder({ id: d.id, ...d }));
  // Orden por fecha de creación DESC
  list.sort((a, b) => {
    const at = a.createdAt?.getTime?.() ?? 0;
    const bt = b.createdAt?.getTime?.() ?? 0;
    return bt - at;
  });
  return list;
}

export async function updateOrderStatus(orderId, status) {
  const clean = String(status || "").trim();
  if (!orderId || !clean) throw new Error("Parámetros inválidos");
  await setOne("orders", orderId, { status: clean, updatedAt: serverTimestamp() });
}
