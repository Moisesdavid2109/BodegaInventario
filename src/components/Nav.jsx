import React, { useEffect, useState } from 'react'
import * as db from '../lib/db'

export default function Nav({ view, setView, people = [] }) {
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const menuBtnRef = React.useRef(null)
  const sidebarRef = React.useRef(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const now = new Date()
      const dismissals = await db.getNotifDismissals()
      const nots = (people || []).map(p => {
        const total = (p.debts||[]).reduce((s,d)=> s + (Number(d.amount)||0), 0)
        if (!(total > 0)) return null // Solo notificar si debe dinero
        // Buscar la última vez que abonó (pago negativo)
        const pagos = (p.debts||[]).filter(d => Number(d.amount) < 0)
        let ultimaAbono = null
        if (pagos.length > 0) {
          ultimaAbono = new Date(Math.max(...pagos.map(d => new Date(d.date).getTime())))
        } else {
          // Si nunca ha abonado, usar la fecha de la primera deuda
          const deudas = (p.debts||[]).filter(d => Number(d.amount) > 0)
          if (deudas.length > 0) ultimaAbono = new Date(Math.min(...deudas.map(d => new Date(d.date).getTime())))
        }
        if (!ultimaAbono) return null
        // Notificar solo si hoy es viernes o después, y el último abono (o la primera deuda) fue antes del viernes de esta semana
        // 0: domingo, 1: lunes, ..., 5: viernes, 6: sábado
        const hoyDia = now.getDay()
        // Calcular el viernes de esta semana
        const viernesEstaSemana = new Date(now)
        viernesEstaSemana.setDate(now.getDate() - hoyDia + 5)
        viernesEstaSemana.setHours(0,0,0,0)
        // Si hoy es viernes o después, y la última vez que abonó (o la primera deuda) fue antes del viernes de esta semana
        if (hoyDia >= 5 && ultimaAbono < viernesEstaSemana) {
          const d = (dismissals || []).find(x => x.personId === p.id)
          if (d && new Date(d.dismissedAt) >= ultimaAbono) return null
          return { id: p.id, name: p.name, weeks: Math.floor((now - ultimaAbono) / (1000*60*60*24*7)), lastChange: ultimaAbono }
        }
        return null
      }).filter(Boolean)
      if (mounted) setNotifications(nots)
    })()
    return () => { mounted = false }
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

  const dismiss = async (personId) => {
    await db.dismissNotification(personId)
    const nots = (await db.getNotifDismissals())
    // force recompute by re-running effect via state toggle
    setNotifications(n => n.filter(x => x.id !== personId))
  }

  const clearAll = async () => {
    await db.clearAllNotifDismissals()
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
          {notifications.length > 0 && (
            <span className="badge">{notifications.length}</span>
          )}
          {notifOpen && (
            <div className="notif-dropdown">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 8px'}}>
                <strong>Notificaciones</strong>
                <button onClick={clearAll} style={{fontSize:12, background:'transparent', border:0, color:'#666', cursor:'pointer'}}>Limpiar todas</button>
              </div>
              {notifications.length === 0 ? (
                <div className="notif-empty">No hay notificaciones</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="notif-item" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>El cliente {n.name} lleva {n.weeks} semanas sin abonar</div>
                    <button onClick={()=>dismiss(n.id)} style={{marginLeft:8, background:'transparent', border:0, color:'#999', cursor:'pointer'}}>Ignorar</button>
                  </div>
                ))
              )}
            </div>
          )}
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
