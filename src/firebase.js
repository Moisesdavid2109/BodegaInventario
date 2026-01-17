// Archivo opcional para inicializar Firebase y usar Firestore.
// Por ahora la app usa localStorage por defecto. Si quieres usar Firestore:
// 1) copia src/firebaseConfig.example.js a src/firebaseConfig.js y añade las credenciales.
// 2) instala dependencias con `npm install`.

import firebaseConfig from './firebaseConfig'

export const isFirebaseConfigured = !!firebaseConfig

// Si necesitas, aquí puedes inicializar Firebase y exportar helpers.
// Esto es un ejemplo comentado para evitar errores si no instalas firebase.

/*
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

let app = null
let db = null
if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
}

export { app, db }
*/

export const app = null
export const db = null
