import React, { useState } from 'react'
import * as db from '../lib/db'

export default function Catalog({ products = [], onAdd }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  const add = () => {
    if (!name) return
    db.addProduct({ name, price: parseFloat(price) || 0 })
    setName('')
    setPrice('')
    onAdd()
  }

  return (
    <section>
      <h2>Catálogo</h2>
      <div className="form">
        <input placeholder="Nombre del producto" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Precio" value={price} onChange={e=>setPrice(e.target.value)} />
        <button onClick={add}>Añadir producto</button>
      </div>

      <ul className="list">
        {products.map(p => (
          <li key={p.id}>{p.name} — ${p.price}</li>
        ))}
      </ul>
    </section>
  )
}
