// service-worker.js
// Service worker básico para PWA

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  clients.claim();
});

// Puedes agregar caché aquí si lo deseas, pero este es el mínimo necesario
