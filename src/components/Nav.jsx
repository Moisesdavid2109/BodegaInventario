import React, { useEffect, useState } from 'react'
import * as db from '../lib/db'

export default function Nav({ view, setView, people = [] }) {
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const menuBtnRef = React.useRef(null)
  const sidebarRef = React.useRef(null)

  // Notificaciones deshabilitadas: setNotifications([]) siempre
  useEffect(() => {
    setNotifications([])
  }, [people])

  // Manage focus: when sidebar closes, if focus was inside it, restore to menu button.
  useEffect(() => {
    if (!open) {
      try {
        const active = document.activeElement
        if (sidebarRef.current && active && sidebarRef.current.contains(active)) {
          if (menuBtnRef.current && typeof menuBtnRef.current.focus === 'function') menuBtnRef.current.focus()
          else document.body.focus()
        }
      } catch (e) { /* ignore */ }
    } else {
      // When opening, move focus to first focusable inside sidebar (close button)
      try {
        const closeBtn = sidebarRef.current && sidebarRef.current.querySelector('.close')
        if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus()
      } catch (e) { }
    }
  }, [open])

  // Notificaciones deshabilitadas
  const dismiss = async (personId) => {
    setNotifications(n => n.filter(x => x.id !== personId))
  }
  const clearAll = async () => {
    setNotifications([])
  }

  const go = v => {
    setView && setView(v)
    setOpen(false)
  }

  return (
    <>
      <header className="nav">
        <button ref={menuBtnRef} className="menu" onClick={() => setOpen(true)} aria-label="Abrir menú">☰</button>
        <h1>Bodegalista</h1>
        <div className="bell" style={{position:'relative'}}>
          <button aria-label="Notificaciones" className="bell-btn" onClick={()=>setNotifOpen(v=>!v)}>🔔</button>
          {/* Notificaciones deshabilitadas visualmente */}
        </div>
      </header>

      <div ref={sidebarRef} className={`sidebar ${open? 'open':''}`} role="dialog" aria-hidden={!open}>
        <button className="close" onClick={() => setOpen(false)} aria-label="Cerrar menú">✕</button>
        <div className="sidebar-header">
          <h3>Menú</h3>
        </div>
        <nav className="sidebar-nav">
          <button className={view==='catalog' ? 'active' : ''} onClick={() => go('catalog')}>Catálogo</button>
          <button className={view==='accounts' ? 'active' : ''} onClick={() => go('accounts')}>Gestor de Cuentas</button>
        </nav>
      </div>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
    </>
  )
}
