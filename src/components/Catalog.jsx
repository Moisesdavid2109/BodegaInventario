import React, { useMemo, useState } from 'react'
import defaultData from '../data/products.json'

export default function Catalog({ products = [], saldo, onSaldoChange }) {
  const [query, setQuery] = useState('')
  const categories = ['General','Limpieza','Viveres','Dulces']
  const [category, setCategory] = useState('General')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = (products && products.length) ? products : (defaultData && defaultData.products ? defaultData.products : [])
    let list = (source || []).map(p => ({
      id: p.id || p.name || Math.random().toString(36).slice(2,8),
      name: p.name || p.nombre,
      category: p.category || p.categoria || 'General',
      image: p.image || p.imagen || null
    }))
    // 'General' should display all products, so only filter when a specific category is selected
    if (category && category !== 'General') list = list.filter(p => (p.category||'General') === category)
    if (!q) return list
    return list.filter(p => (p.name||'').toLowerCase().includes(q))
  }, [products, query, category])

  // debug: cuántos visibles
  console.log('[Catalog] visible products:', visible.length)


  return (
    <section>
      <div className="panel">
        <div className="panel-header"><h2>Catálogo</h2></div>
        <div className="search">
          <input placeholder="Buscar productos..." value={query} onChange={e=>setQuery(e.target.value)} />
        </div>

        <div className="categories" role="tablist">
          {categories.map(c => (
            <button key={c} className={"cat-btn" + (category===c? ' active':'')} onClick={()=>setCategory(c)}>{c}</button>
          ))}
        </div>

        {/* ...el saldo y los botones de añadir/restar han sido eliminados del catálogo... */}

        <ul className="catalog-list">
          {visible.map(p => (
            <li className="card" key={p.id}>
              <div className="thumb">
                <img
                  src={p.image || `https://picsum.photos/seed/${encodeURIComponent(p.id)}/200/200`}
                  alt={p.name}
                  onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(p.id)}/200/200` }}
                />
              </div>
              <div className="info">
                <div className="title">{p.name}</div>
                <div className="meta">{p.category || 'General'}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
