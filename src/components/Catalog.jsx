import React, { useMemo, useState } from 'react';
import defaultData from '../data/products.json';

export default function Catalog({ products = [] }) {
  // Estado de búsqueda y categoría seleccionada
  const [busqueda, setBusqueda] = useState('');
  const categorias = ['General', 'Limpieza', 'Viveres', 'Dulces'];
  const [categoria, setCategoria] = useState('General');

  // Calcula los productos visibles según búsqueda y categoría
  const productosVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const fuente = (products && products.length) ? products : (defaultData && defaultData.products ? defaultData.products : []);
    let lista = (fuente || []).map(p => ({
      id: p.id || p.name || Math.random().toString(36).slice(2, 8),
      name: p.name || p.nombre,
      category: p.category || p.categoria || 'General',
      image: p.image || p.imagen || null
    }));
    // Filtra por categoría si no es 'General'
    if (categoria && categoria !== 'General') lista = lista.filter(p => (p.category || 'General') === categoria);
    // Filtra por búsqueda
    if (!q) return lista;
    return lista.filter(p => (p.name || '').toLowerCase().includes(q));
  }, [products, busqueda, categoria]);

  // Muestra la cantidad de productos visibles en consola
  console.log('[Catalog] productos visibles:', productosVisibles.length);

  return (
    <section>
      <div className="panel">
        <div className="panel-header"><h2>Catálogo</h2></div>
        <div className="search">
          <input placeholder="Buscar productos..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="categories" role="tablist">
          {categorias.map(c => (
            <button key={c} className={"cat-btn" + (categoria === c ? ' active' : '')} onClick={() => setCategoria(c)}>{c}</button>
          ))}
        </div>
        <ul className="catalog-list">
          {productosVisibles.map(p => (
            <li className="card" key={p.id}>
              <div className="thumb">
                <img
                  src={p.image || `https://picsum.photos/seed/${encodeURIComponent(p.id)}/200/200`}
                  alt={p.name}
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(p.id)}/200/200`; }}
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
  );
}
