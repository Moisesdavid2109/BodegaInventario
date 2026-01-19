import React, { useState } from 'react'

export default function Nav({ view, setView }) {
  const [open, setOpen] = useState(false)

  const go = v => {
    setView && setView(v)
    setOpen(false)
  }

  return (
    <>
      <header className="nav">
        <div className="menu" onClick={() => setOpen(true)} aria-label="Abrir menú">☰</div>
        <h1>Bodegalista</h1>
        <div className="bell">🔔</div>
      </header>

      <div className={`sidebar ${open? 'open':''}`} role="dialog" aria-hidden={!open}>
        <button className="close" onClick={() => setOpen(false)} aria-label="Cerrar menú">✕</button>
        <nav className="sidebar-nav">
          <button className={view==='catalog' ? 'active' : ''} onClick={() => go('catalog')}>Catálogo</button>
          <button className={view==='accounts' ? 'active' : ''} onClick={() => go('accounts')}>Gestor de Cuentas</button>
        </nav>
      </div>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
    </>
  )
}
