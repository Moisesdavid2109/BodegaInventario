import React, { useState } from 'react'
import * as db from '../lib/db'

function fmt(n){
  const nf = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
  if (!n && n !== 0) return nf.format(0)
  return nf.format(Number(n))
}

export default function Accounts({ people = [], products = [], onChange }) {
  const [personName, setPersonName] = useState('')
  const [cash, setCash] = useState(() => db.getCash())
  const [inlineMode, setInlineMode] = useState(null) // 'add' | 'sub' | null
  const [inlineValue, setInlineValue] = useState('')

  const totalAll = () => cash

  const refreshCash = () => setCash(db.getCash())

  const openInline = (mode) => {
    setInlineMode(mode)
    setInlineValue('')
  }

  const confirmInline = () => {
    if (!inlineValue) return
    const value = parseFloat(inlineValue.replace(',', '.'))
    if (Number.isNaN(value)) return alert('Monto inválido')
    const amt = inlineMode === 'add' ? Math.abs(value) : -Math.abs(value)
    db.addCash(amt)
    refreshCash()
    setInlineMode(null)
    setInlineValue('')
    onChange && onChange()
  }

  const cancelInline = () => {
    setInlineMode(null)
    setInlineValue('')
  }

  const removeAllPeople = () => {
    if (!confirm('¿Borrar todas las personas? Esta acción no se puede deshacer.')) return
    db.clearPeople()
    onChange && onChange()
  }

  const addPerson = () => {
    if (!personName) return
    db.addPerson({ name: personName })
    setPersonName('')
    onChange()
  }

  const addQuick = (personId) => {
    // kept for backward compat if called elsewhere
    const raw = prompt('Ingrese monto a agregar (número):', '0')
    if (!raw) return
    const value = parseFloat(raw.replace(',', '.'))
    if (Number.isNaN(value)) return alert('Monto inválido')
    db.addDebt(personId, { productId: null, amount: value, date: new Date().toISOString() })
    onChange && onChange()
  }

  const subQuick = (personId) => {
    const raw = prompt('Ingrese monto a descontar (número):', '0')
    if (!raw) return
    const value = parseFloat(raw.replace(',', '.'))
    if (Number.isNaN(value)) return alert('Monto inválido')
    // store negative amount as payment
    db.addDebt(personId, { productId: null, amount: -Math.abs(value), date: new Date().toISOString() })
    onChange && onChange()
  }

  const totalFor = (p) => {
    return (p.debts||[]).reduce((s,d)=> s + (Number(d.amount)||0), 0)
  }

  // Inline per-person input
  const [personInline, setPersonInline] = useState({ personId: null, mode: null })
  const [personInlineValue, setPersonInlineValue] = useState('')

  const openPersonInline = (personId, mode) => {
    setPersonInline({ personId, mode })
    setPersonInlineValue('')
  }

  const confirmPersonInline = (personId) => {
    if (!personInlineValue) return
    const value = parseFloat(personInlineValue.replace(',', '.'))
    if (Number.isNaN(value)) return alert('Monto inválido')
    const amt = personInline.mode === 'add' ? Math.abs(value) : -Math.abs(value)
    db.addDebt(personId, { productId: null, amount: amt, date: new Date().toISOString() })
    setPersonInline({ personId: null, mode: null })
    setPersonInlineValue('')
    onChange && onChange()
  }

  const cancelPersonInline = () => {
    setPersonInline({ personId: null, mode: null })
    setPersonInlineValue('')
  }

  return (
    <section>
      <div className="balance-panel panel">
        <div className="balance-amount">{fmt(totalAll())}</div>
        <div className="big-actions">
          <button className="btn-add" onClick={()=>openInline('add')}>+ Añadir</button>
          <button className="btn-sub" onClick={()=>openInline('sub')}>− Restar</button>
        </div>

        {inlineMode && (
          <div className="inline-input">
            <input inputMode="numeric" placeholder="0" value={inlineValue} onChange={e=>setInlineValue(e.target.value)} />
            <div className="inline-actions">
              <button className="confirm" onClick={confirmInline}>OK</button>
              <button className="cancel" onClick={cancelInline}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div className="daily-summary panel">
        <h3>Resumen Diario</h3>
        {(() => {
          // build small multi-day mountain chart based on recent cash transactions
          const tx = db.getCashTransactions() || []
          // group by last 5 days (incl today)
          const days = []
          for (let i = 4; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            days.push(d.toISOString().slice(0,10))
          }
          const nets = days.map(day => {
            const dayTx = tx.filter(t => t && t.date && t.date.slice(0,10) === day)
            return dayTx.reduce((s,t) => s + (Number(t.amount)||0), 0)
          })
          const max = Math.max(...nets.map(n=>Math.abs(n)), 1)
          const scaled = nets.map(n => Math.round((Math.abs(n) / max) * 48))
          const todayNet = nets[nets.length - 1] || 0
          const s = db.getTodayCashSummary()
          return (
            <>
              <div className="summary-rows">
                <div className="summary-row"><span>Ingresos Hoy</span><span className="income">{fmt(s.incomes)}</span></div>
                <div className="summary-row"><span>Gastos Hoy</span><span className="expense">{fmt(s.expenses)}</span></div>
              </div>
              <div className="chart" aria-hidden>
                <svg viewBox="0 0 120 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img">
                  <defs>
                    <linearGradient id="mountainGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#5fb7ff" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#1f6fbf" stopOpacity="0.12" />
                    </linearGradient>
                    <linearGradient id="mountainStroke" x1="0" x2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const pts = scaled.map((h, idx) => {
                      const x = 8 + idx * 22
                      const y = 56 - h
                      return { x, y }
                    })
                    const firstX = pts[0].x
                    const lastX = pts[pts.length - 1].x
                    const polygonPoints = pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${lastX},56 ${firstX},56`
                    const polylinePoints = pts.map(p => `${p.x},${p.y}`).join(' ')
                    const todayPt = pts[pts.length - 1]
                    return (
                      <>
                        <polygon points={polygonPoints} fill="url(#mountainGrad)" />
                        <polyline points={polylinePoints} fill="none" stroke="url(#mountainStroke)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx={todayPt.x} cy={todayPt.y} r="3.6" fill="#08469a" stroke="#fff" strokeWidth="1" />
                      </>
                    )
                  })()}
                </svg>
                <div className="chart-net">{todayNet >= 0 ? '+' : ''}{fmt(todayNet)} Hoy</div>
              </div>
            </>
          )
        })()}
      </div>

      <h2>Clientes que deben</h2>

      <div className="person-form form small">
        <div className="person-input">
          <span className="icon-user" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#A0B0B8"/>
              <path d="M4 20c0-3.314 4.03-6 8-6s8 2.686 8 6v1H4v-1z" fill="#A0B0B8"/>
            </svg>
          </span>
          <input className="input-person" placeholder="Nombre de la persona" value={personName} onChange={e=>setPersonName(e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-person-add" onClick={addPerson}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" fill="#fff"/></svg>
            <span>Añadir persona</span>
          </button>
        </div>
      </div>

      <div className="people">
        {people.map(p => (
          <div key={p.id} className="person">
            <div className="avatar">
              <img src={`https://picsum.photos/seed/${encodeURIComponent(p.id)}/200/200`} alt={p.name} />
            </div>
            <div className="info">
              <h3>{p.name}</h3>
            </div>
            <div className="actions">
              <div className="amount">{fmt(totalFor(p))}</div>
              <div className="quick">
                {! (personInline.personId === p.id) ? (
                  <>
                    <button className="add" title="Agregar deuda" onClick={()=>openPersonInline(p.id,'add')}>+</button>
                    <button className="sub" title="Registrar pago" onClick={()=>openPersonInline(p.id,'sub')}>-</button>
                  </>
                ) : (
                  <div className="person-inline">
                    <input inputMode="numeric" placeholder="0" value={personInlineValue} onChange={e=>setPersonInlineValue(e.target.value)} />
                    <div className="person-inline-actions">
                      <button className="confirm" onClick={()=>confirmPersonInline(p.id)}>OK</button>
                      <button className="cancel" onClick={cancelPersonInline}>X</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </section>
  )
}
