import React, { useState } from 'react'
import * as db from '../lib/db'

function fmt(n){
  if (!n && n !== 0) return '$0'
  return '$' + Number(n).toLocaleString('es-CL')
}

export default function Accounts({ people = [], products = [], onChange }) {
  const [personName, setPersonName] = useState('')
  const [cash, setCash] = useState(() => db.getCash())

  const totalAll = () => {
    return cash
  }

  const refreshCash = () => setCash(db.getCash())

  const handleHeaderAdd = () => {
    const raw = prompt('Ingrese monto a añadir al saldo (número):', '0')
    if (!raw) return
    const value = parseFloat(raw.replace(',', '.'))
    if (Number.isNaN(value)) return alert('Monto inválido')
    db.addCash(Math.abs(value))
    refreshCash()
    onChange && onChange()
  }

  const handleHeaderSub = () => {
    const raw = prompt('Ingrese monto a restar del saldo (número):', '0')
    if (!raw) return
    const value = parseFloat(raw.replace(',', '.'))
    if (Number.isNaN(value)) return alert('Monto inválido')
    db.addCash(-Math.abs(value))
    refreshCash()
    onChange && onChange()
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

  return (
    <section>
      <div className="balance-panel panel">
        <div className="balance-amount">{fmt(totalAll())}</div>
        <div className="big-actions">
          <button className="btn-add" onClick={handleHeaderAdd}>+ Añadir</button>
          <button className="btn-sub" onClick={handleHeaderSub}>− Restar</button>
        </div>
      </div>

      <div className="form small">
        <input placeholder="Nombre de la persona" value={personName} onChange={e=>setPersonName(e.target.value)} />
        <button onClick={addPerson}>Añadir persona</button>
        <button onClick={removeAllPeople} style={{marginLeft:8,background:'#f44',color:'#fff'}}>Borrar todas</button>
      </div>

      <div className="people">
        {people.map(p => (
          <div key={p.id} className="person">
            <div className="avatar">
              <img src={`https://picsum.photos/seed/${encodeURIComponent(p.id)}/200/200`} alt={p.name} />
            </div>
            <div className="info">
              <h3>{p.name}</h3>
              <div className="meta">{(p.debts||[]).length} movimientos</div>
            </div>
            <div className="actions">
              <div className="amount">{fmt(totalFor(p))}</div>
              <div className="quick">
                <button className="add" title="Agregar deuda" onClick={()=>addQuick(p.id)}>+</button>
                <button className="sub" title="Registrar pago" onClick={()=>subQuick(p.id)}>-</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
