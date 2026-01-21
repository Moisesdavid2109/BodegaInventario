import { getFirestoreInstance } from './firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";

// Guardar el estado del gestor para un usuario
export async function guardarEstadoGestor({ saldo, resumenDiario, clientes, uid }) {
  const db = getFirestoreInstance();
  // Leer el estado actual para no borrar accidentalmente el resumenDiario
  const docRef = doc(db, "usuarios", uid, "gestor", "estadoActual");
  let prev = {};
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) prev = snap.data();
  } catch {}
  // Asegurar que la fecha se preserve
  let resumen = resumenDiario ?? prev.resumenDiario ?? { ingresos: 0, gastos: 0, diferencia: 0, fecha: undefined };
  if (!resumen.fecha) {
    // Si no hay fecha, poner la de hoy
    resumen.fecha = new Date().toISOString().slice(0, 10);
  }
  await setDoc(docRef, {
    saldo,
    resumenDiario: resumen,
    clientes
  });
}

// Leer el estado del gestor para un usuario
export async function obtenerEstadoGestor(uid) {
  const db = getFirestoreInstance();
  const docRef = doc(db, "usuarios", uid, "gestor", "estadoActual");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    // Asegurar que los campos sean arrays aunque no existan
    if (!Array.isArray(data.clientes)) data.clientes = [];
    if (!Array.isArray(data.products)) data.products = [];
    if (typeof data.saldo !== 'number') data.saldo = 0;
    if (typeof data.resumenDiario !== 'object' || !data.resumenDiario) data.resumenDiario = { ingresos: 0, gastos: 0, diferencia: 0, fecha: new Date().toISOString().slice(0, 10) };
    if (!data.resumenDiario.fecha) data.resumenDiario.fecha = new Date().toISOString().slice(0, 10);
    return data;
  } else {
    return { saldo: 0, resumenDiario: { ingresos: 0, gastos: 0, diferencia: 0, fecha: new Date().toISOString().slice(0, 10) }, clientes: [], products: [] };
  }
}