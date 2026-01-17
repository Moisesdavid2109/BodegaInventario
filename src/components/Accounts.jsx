import React, { useState } from 'react'
import * as db from '../lib/db'

export default function Accounts({ people = [], products = [], onChange }) {
  const [personName, setPersonName] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [amount, setAmount] = useState('')

  const addPerson = () => {
    if (!personName) return
    db.addPerson({ name: personName })
    setPersonName('')
    onChange()
  }

  const addDebt = (personId) => {
    if (!selectedProduct && !amount) return
    db.addDebt(personId, {
      productId: selectedProduct || null,
      amount: parseFloat(amount) || 0,
      date: new Date().toISOString(),
    })
    setSelectedProduct('')
    setAmount('')
    onChange()
  }

  return (
    <section>
      <h2>Gestor de Cuentas</h2>

      <div className="form small">
        <input placeholder="Nombre de la persona" value={personName} onChange={e=>setPersonName(e.target.value)} />
        <button onClick={addPerson}>Añadir persona</button>
      </div>

      <div className="people">
        {people.map(p => (
          <div key={p.id} className="person">
            <h3>{p.name}</h3>
            <div className="form small">
              <select value={selectedProduct} onChange={e=>setSelectedProduct(e.target.value)}>
                <option value="">-- seleccionar producto --</option>
                {products.map(prod=> (
                  <option key={prod.id} value={prod.id}>{prod.name} — ${prod.price}</option>
                ))}
              </select>
              <input placeholder="Monto" value={amount} onChange={e=>setAmount(e.target.value)} />
              <button onClick={()=>addDebt(p.id)}>Agregar deuda</button>
            </div>

            <ul>
              {(p.debts||[]).map((d, i) => (
                <li key={i}>{d.productName || d.productId || '—'}: ${d.amount} ({new Date(d.date).toLocaleString()})</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
