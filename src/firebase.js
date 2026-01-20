import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de tu app de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA8seBuRxhLqUoSHaA_2gYIv_YKnjxAw",
  authDomain: "bodegalista-56515.firebaseapp.com",
  projectId: "bodegalista-56515",
  storageBucket: "bodegalista-56515.appspot.com",
  messagingSenderId: "911683513197",
  appId: "1:911683513197:web:334de18b7e325565d4c864",
  measurementId: "G-QN38RJF8ZT"
};

// Inicializa Firebase solo una vez
let app = null;
let db = null;

export function initFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return app;
}

export function getFirestoreInstance() {
  if (!db) {
    initFirebase();
  }
  return db;
}

export { app };