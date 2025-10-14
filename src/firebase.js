// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection, doc, getDoc, getDocs,
  setDoc, addDoc, deleteDoc,
  writeBatch, serverTimestamp,
  query, where, orderBy, limit as qLimit,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

/** Helpers de ENV (Vite) */
const ENV = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MSG_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

function assertEnv(obj) {
  const missing = Object.entries(obj)
    .filter(([, v]) => !v || String(v).trim() === "")
    .map(([k]) => k);
  if (missing.length) {
    // Lanzamos error sólo en dev para ayudarte a detectar faltantes
    if (import.meta.env.DEV) {
      throw new Error(`[firebase] Faltan variables de entorno: ${missing.join(", ")}`);
    }
    console.warn("[firebase] Variables de entorno incompletas:", missing);
  }
}
assertEnv(ENV);

// Normalizamos el bucket si alguien puso firebasestorage.app por error
const normalizedBucket = String(ENV.storageBucket || "")
  .replace(/\.firebasestorage\.app$/i, ".appspot.com");

const firebaseConfig = {
  apiKey: ENV.apiKey,
  authDomain: ENV.authDomain,
  projectId: ENV.projectId,
  storageBucket: normalizedBucket,
  messagingSenderId: ENV.messagingSenderId,
  appId: ENV.appId,
};

const app = initializeApp(firebaseConfig);

// --------- Firestore ---------
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
    const refDoc = hasId ? doc(colRef, String(rawId)) : doc(colRef);
    const base = hasId ? {} : { createdAt: serverTimestamp() };
    batch.set(refDoc, { ...base, ...item, updatedAt: serverTimestamp() }, { merge: true });
  }
  await batch.commit();
}

export async function addOne(col, data) {
  const refDoc = await addDoc(getColRef(col), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return refDoc.id;
}

export async function setOne(col, id, data) {
  if (!id) throw new Error(`setOne: id inválido para ${col}`);
  await setDoc(doc(db, col, String(id)), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getOne(col, id) {
  const safeId = String(id ?? "").trim();
  if (!safeId) return null;
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

    // Filtros simples == (client-side)
    for (const [f, op, v] of whereEq) {
      if (op === "==" || op === "equal" || op === "eq") {
        out = out.filter((row) => String(row?.[f] ?? "") === String(v ?? ""));
      }
    }

    // Orden simple client-side
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

// --------- Storage + Auth ---------
export const storage = getStorage(app);
const auth = getAuth(app);

export async function ensureAnonAuth() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (e) {
    console.warn("[firebase] Anonymous auth failed:", e);
    throw e;
  }
  return auth.currentUser;
}

/**
 * Sube una imagen a /images/<slug>.<ext> y devuelve { url, path }
 */
export async function uploadProductImage(file, slug) {
  if (!file || !slug) throw new Error("Falta archivo o slug");
  const nameParts = String(file.name || "").split(".");
  const ext = (nameParts.pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `images/${slug}.${ext}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "image/*" });
  const url = await getDownloadURL(r);
  return { url, path };
}
