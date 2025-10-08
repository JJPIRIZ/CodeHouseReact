import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection, doc, getDoc, getDocs,
  setDoc, addDoc, deleteDoc,
  writeBatch, serverTimestamp,
  query, where, orderBy, limit as qLimit,
} from "firebase/firestore";

// Config pública que ya tenías (sin Auth)
const firebaseConfig = {
  apiKey: "AIzaSyDbItCrd70jy677E-OeUDt5LMXVTA6ovcU",
  authDomain: "mastecno-32016.firebaseapp.com",
  projectId: "mastecno-32016",
  storageBucket: "mastecno-32016.firebasestorage.app",
  messagingSenderId: "180304289577",
  appId: "1:180304289577:web:cfbeafce321f0a37796138",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --------- CRUD helpers ---------
export function getColRef(col) {
  return collection(db, col);
}

export async function batchUpsert(col, items, idKey = "id") {
  const batch = writeBatch(db);
  const colRef = getColRef(col);
  for (const item of items) {
    const rawId = item?.[idKey];
    const hasId = rawId != null && String(rawId).trim() !== "";
    const ref = hasId ? doc(colRef, String(rawId)) : doc(colRef);
    const base = hasId ? {} : { createdAt: serverTimestamp() };
    batch.set(ref, { ...base, ...item, updatedAt: serverTimestamp() }, { merge: true });
  }
  await batch.commit();
}

export async function addOne(col, data) {
  const ref = await addDoc(getColRef(col), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setOne(col, id, data) {
  if (!id) throw new Error(`setOne: id inválido para ${col}`);
  await setDoc(doc(db, col, String(id)), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getOne(col, id) {
  const safeId = String(id ?? "").trim();
  if (!safeId) return null; // evita "Invalid document reference"
  const snap = await getDoc(doc(db, col, safeId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAll(col, { whereEq = [], order = null, limit = null } = {}) {
  let qRef = getColRef(col);
  for (const [f, op, v] of whereEq) qRef = query(qRef, where(f, op, v));
  if (order?.field) qRef = query(qRef, orderBy(order.field, order.dir || "asc"));
  if (limit) qRef = query(qRef, qLimit(limit));
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ✅ Fallback si Firestore pide índice compuesto
export async function getAllSafe(col, opts = {}) {
  try {
    return await getAll(col, opts);
  } catch (e) {
    const msg = String(e?.message || e?.code || "");
    const needsIndex = /index/i.test(msg) || e?.code === "failed-precondition";
    if (!needsIndex) throw e;

    const { whereEq = [], order = null, limit = null } = opts;
    const snap = await getDocs(getColRef(col));
    let out = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Filtros simples ==
    for (const [f, op, v] of whereEq) {
      if (op === "==" || op === "equal" || op === "eq") {
        out = out.filter((row) => String(row?.[f] ?? "") === String(v ?? ""));
      }
    }

    // Orden simple por string/numero
    if (order?.field) {
      const dir = (order.dir || "asc").toLowerCase();
      out.sort((a, b) => {
        const av = a?.[order.field]; const bv = b?.[order.field];
        if (typeof av === "number" && typeof bv === "number") {
          return dir === "desc" ? bv - av : av - bv;
        }
        return dir === "desc"
          ? String(bv ?? "").localeCompare(String(av ?? ""))
          : String(av ?? "").localeCompare(String(bv ?? ""));
      });
    }

    if (limit) out = out.slice(0, limit);
    return out;
  }
}

export async function removeOne(col, id) {
  const safeId = String(id ?? "").trim();
  if (!safeId) return;
  await deleteDoc(doc(db, col, safeId));
}
