import React, { useEffect, useState, useRef } from 'react';

export default function Nav({ view, setView, people = [] }) {
  // Estado de apertura del menú lateral
  const [abierto, setAbierto] = useState(false);
  const menuBtnRef = useRef(null);
  const sidebarRef = useRef(null);

  // Notificaciones deshabilitadas
  useEffect(() => {}, [people]);

  // Gestiona el foco al abrir/cerrar el menú lateral
  useEffect(() => {
    if (!abierto) {
      try {
        const activo = document.activeElement;
        if (sidebarRef.current && activo && sidebarRef.current.contains(activo)) {
          if (menuBtnRef.current && typeof menuBtnRef.current.focus === 'function') menuBtnRef.current.focus();
          else document.body.focus();
        }
      } catch (e) {}
    } else {
      try {
        const btnCerrar = sidebarRef.current && sidebarRef.current.querySelector('.close');
        if (btnCerrar && typeof btnCerrar.focus === 'function') btnCerrar.focus();
      } catch (e) { }
    }
  }, [abierto]);

  // Cambia la vista y cierra el menú
  const irA = v => {
    setView && setView(v);
    setAbierto(false);
  };

  return (
    <>
      <header className="nav">
        <button ref={menuBtnRef} className="menu" onClick={() => setAbierto(true)} aria-label="Abrir menú">☰</button>
        <h1>Bodegalista</h1>
        <div className="bell" style={{ position: 'relative' }}>
          <button aria-label="Notificaciones" className="bell-btn" disabled>🔔</button>
        </div>
      </header>

      <div ref={sidebarRef} className={`sidebar ${abierto ? 'open' : ''}`} role="dialog" aria-hidden={!abierto}>
        <button className="close" onClick={() => setAbierto(false)} aria-label="Cerrar menú">✕</button>
        <div className="sidebar-header">
          <h3>Menú</h3>
        </div>
        <nav className="sidebar-nav">
          <button className={view === 'catalog' ? 'active' : ''} onClick={() => irA('catalog')}>Catálogo</button>
          <button className={view === 'accounts' ? 'active' : ''} onClick={() => irA('accounts')}>Gestor de Cuentas</button>
        </nav>
      </div>

      {abierto && <div className="backdrop" onClick={() => setAbierto(false)} />}
    </>
  );
}
