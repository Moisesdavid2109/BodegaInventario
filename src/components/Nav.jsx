import React from 'react'

export default function Nav({ view, setView }) {
  return (
    <header className="nav">
      <h1>Bodega Lista</h1>
      <nav>
        <button onClick={() => setView('catalog')} className={view==='catalog'? 'active':''}>Catálogo</button>
        <button onClick={() => setView('accounts')} className={view==='accounts'? 'active':''}>Gestor de Cuentas</button>
      </nav>
    </header>
  )
}
