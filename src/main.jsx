import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import './styles.css'

// En desarrollo, elimina cualquier service worker viejo que quede registrado
// (por ejemplo, los generados por versiones anteriores con devOptions.enabled).
if (import.meta.env.DEV) {
  navigator.serviceWorker?.getRegistrations?.().then(regs => {
    regs.forEach(r => r.unregister());
  }).catch(() => {});
}

registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
