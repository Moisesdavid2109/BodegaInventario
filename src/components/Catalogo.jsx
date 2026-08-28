import React, { useMemo, useState } from 'react';
import { Search, Plus, Pencil, MoreVertical, ShoppingCart, Trash2 } from 'lucide-react';

const CATEGORIAS = ['General', 'Limpieza', 'Víveres', 'Dulces'];
const STOCK_MINIMO = 5;

function formatearMoneda(n) {
  const formato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  if (!n && n !== 0) return formato.format(0);
  return formato.format(Number(n));
}

// Normaliza el campo de categoría: "Dulce" -> "Dulces", "Viveres"/"Víveres" -> "Víveres"
function normalizarCategoria(c) {
  const s = String(c || 'General').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (s.startsWith('dulce')) return 'Dulces';
  if (s.startsWith('viver')) return 'Víveres';
  if (s.startsWith('limp')) return 'Limpieza';
  return 'General';
}

export default function Catalogo({ products = [], onAddToCart, onNuevoProducto, onEditar, onEliminar }) {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('General');
  const [menuAbierto, setMenuAbierto] = useState(null);

  const productosVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = (products || []).map(p => ({
      id: p.id || p.name || p.nombre || Math.random().toString(36).slice(2, 8),
      name: p.name || p.nombre || '',
      category: normalizarCategoria(p.category || p.categoria),
      price: p.price ?? 0,
      costPrice: Number(p.costPrice ?? p.precioCompra ?? 0) || 0,
      stock: Number(p.stock ?? 0) || 0,
      image: p.image || p.imagen || null,
    }));
    const filtrada = categoria === 'General' ? lista : lista.filter(p => p.category === categoria);
    if (!q) return filtrada;
    return filtrada.filter(p => p.name.toLowerCase().includes(q));
  }, [products, busqueda, categoria]);

  return (
    <section className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl neu-inset focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>
        <button
          onClick={onNuevoProducto}
          className="flex items-center gap-1.5 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-lg px-3.5 py-2.5 font-semibold hover:brightness-105 active:scale-95 transition whitespace-nowrap text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATEGORIAS.map(c => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              categoria === c
                ? 'bg-blue-600 text-white shadow-[0_4px_10px_rgba(37,99,235,0.4)]'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {productosVisibles.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No hay productos para mostrar.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {productosVisibles.map(p => (
            <div
              key={p.id}
              className="neu-sm rounded-2xl p-3 flex items-center gap-3"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={p.image || `https://picsum.photos/seed/${encodeURIComponent(p.id)}/200/200`}
                  alt={p.name}
                  className="w-16 h-16 object-contain"
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(p.id)}/200/200`; }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                <div className="text-gray-400 text-sm">{p.category}</div>
                <div className="text-emerald-600 font-bold">{formatearMoneda(p.price)}</div>
                {p.costPrice > 0 && (
                  <div className="text-xs text-gray-400">Compra: {formatearMoneda(p.costPrice)}</div>
                )}
                <div className={`text-xs font-medium ${p.stock === 0 ? 'text-red-500' : p.stock <= STOCK_MINIMO ? 'text-amber-600' : 'text-gray-400'}`}>
                  {p.stock === 0 ? 'Sin stock' : `${p.stock} en stock`}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEditar && onEditar(p)}
                  className="p-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setMenuAbierto(menuAbierto === p.id ? null : p.id)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                    aria-label="Más opciones"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuAbierto === p.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 p-1 z-10 min-w-32">
                      <button
                        onClick={() => { setMenuAbierto(null); onEliminar && onEliminar(p); }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onAddToCart && onAddToCart(p)}
                  className="p-2 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white hover:brightness-110 active:scale-95 transition"
                  aria-label="Añadir al carrito"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
