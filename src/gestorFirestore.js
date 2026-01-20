import { getFirestoreInstance } from './firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";

// Guardar el estado del gestor
export async function guardarEstadoGestor({ saldo, resumenDiario, clientes }) {
  const db = getFirestoreInstance();
  await setDoc(doc(db, "gestor", "estadoActual"), {
    saldo,
    resumenDiario,
    clientes
  });
}

// Leer el estado del gestor
export async function obtenerEstadoGestor() {
  const db = getFirestoreInstance();
  const docRef = doc(db, "gestor", "estadoActual");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}