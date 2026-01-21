// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0esBuRxhl0AgUoSHaA_z9yIv_YKnjxAw",
  authDomain: "bodegalista-56515.firebaseapp.com",
  projectId: "bodegalista-56515",
  storageBucket: "bodegalista-56515.appspot.com", // <-- CORREGIDO
  messagingSenderId: "911683513197",
  appId: "1:911683513197:web:334de18b7e325565d4c864",
  measurementId: "G-QN38RJFB2T"
};

let app = null;
let db = null;
let auth = null;

export function initFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
  return app;
}

export function getFirestoreInstance() {
  if (!db) initFirebase();
  return db;
}

export function getAuthInstance() {
  if (!auth) initFirebase();
  return auth;
}

export { app };