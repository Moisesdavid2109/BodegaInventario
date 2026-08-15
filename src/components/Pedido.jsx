import React, { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, CheckCircle2, Search } from 'lucide-react';

function formatearMoneda(n) {
  const formato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  if (!n && n !== 0) return formato.format(0);
  return formato.format(Number(n));
}

// Parsea números escritos en formato colombiano ("1.500" -> 1500, "2.500,5" -> 2500.5)
function parseNumero(v) {
  if (v == null) return NaN;
  let s = String(v).trim();
  if (s === '') return NaN;
  s = s.replace(/\s+/g, '');
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes('.')) {
    const partes = s.split('.');
    const ultima = partes[partes.length - 1];
    if (ultima.length === 3) s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? NaN : n;
}

export default function Pedido({
  products = [],
  people = [],
  tipo = 'venta',
  items = [],
  setItems,
  onConfirmarVenta,
  onConfirmarCompra,
  onVolver,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [fiadoPersonaId, setFiadoPersonaId] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [error, setError] = useState('');

  const esVenta = tipo === 'venta';

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let lista = products || [];
    if (q) lista = lista.filter(p => (p.name || '').toLowerCase().includes(q));
    return lista;
  }, [products, busqueda]);

  const añadir = (product) => {
    setError('');
    const existente = items.find(i => i.key === product.id);
    const actualQty = existente ? existente.qty : 0;
    const stock = Number(product.stock) || 0;
    if (esVenta && actualQty + 1 > stock) {
      setError(`Stock insuficiente de "${product.name}" (disponible: ${stock}).`);
      return;
    }
    setItems(prev => {
      const ex = prev.find(i => i.key === product.id);
      if (ex) {
        return prev.map(i => i.key === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      const precio = esVenta
        ? Number(product.price) || 0
        : Number(product.costPrice) || Number(product.price) || 0;
      return [...prev, { key: product.id, product, precio, qty: 1 }];
    });
  };

  const cambiarCantidad = (key, valor) => {
    setError('');
    setItems(prev => prev.map(i => {
      if (i.key !== key) return i;
      let qty = Math.max(1, parseInt(valor, 10) || 1);
      if (esVenta) {
        const stock = Number(i.product?.stock) || 0;
        if (stock > 0 && qty > stock) qty = stock;
      }
      return { ...i, qty };
    }));
  };

  const cambiarPrecio = (key, valor) => {
    setItems(prev => prev.map(i => {
      if (i.key !== key) return i;
      const n = parseNumero(valor);
      const precio = Number.isNaN(n) ? 0 : Math.max(0, n);
      return { ...i, precio };
    }));
  };

  const quitar = (key) => {
    setItems(prev => prev.filter(i => i.key !== key));
  };

  const total = items.reduce((s, i) => s + i.precio * i.qty, 0);
  const cantidades = items.reduce((s, i) => s + i.qty, 0);

  const confirmar = () => {
    if (items.length === 0) return setError('Agrega al menos un producto al pedido.');
    if (esVenta) {
      const sinStock = items.find(i => i.qty > (Number(i.product?.stock) || 0));
      if (sinStock) return setError(`Stock insuficiente de "${sinStock.product?.name}" (disponible: ${Number(sinStock.product?.stock) || 0}).`);
      if (fiadoPersonaId && !people.some(p => p.id === fiadoPersonaId)) return setError('Selecciona un cliente válido.');
    }
    const pedido = items.map(i => ({ product: { ...i.product, price: i.precio }, qty: i.qty, precio: i.precio }));
    if (esVenta) {
      onConfirmarVenta({ items: pedido, total, fiadoPersonaId });
    } else {
      onConfirmarCompra({ items: pedido, total, proveedor: proveedor.trim() || null });
    }
  };

  const inputEstilos = "border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500";

  return (
    <section className="max-w-3xl mx-auto px-4 py-5 pb-28">
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <h2 className="text-lg font-bold text-slate-900 mb-3">{esVenta ? 'Nueva venta' : 'Nueva compra'}</h2>

      <div className={`text-xs font-medium mb-4 rounded-xl px-3 py-2 ${esVenta ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
        {esVenta
          ? 'Venta a cliente: suma a tu caja (o al fiado de un cliente), descuenta del stock y queda registrada en Caja.'
          : 'Pedido de compra: se descuenta de tu caja, suma al stock y queda registrado en Caja.'}
      </div>

      {esVenta && people.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-slate-600 whitespace-nowrap">A fiado de:</span>
          <select
            value={fiadoPersonaId}
            onChange={e => setFiadoPersonaId(e.target.value)}
            className={`${inputEstilos} flex-1 bg-white`}
          >
            <option value="">Contado (suma a la caja)</option>
            {people.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {!esVenta && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-slate-600 whitespace-nowrap">Proveedor:</span>
          <input
            value={proveedor}
            onChange={e => setProveedor(e.target.value)}
            placeholder="Nombre del proveedor (opcional)"
            className={`${inputEstilos} flex-1`}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">
          {esVenta ? 'Agregar productos a la venta' : 'Agregar productos al pedido de compra'}
        </h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm">
            No hay productos para agregar.
          </div>
        ) : (
          <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {productosFiltrados.map(p => {
              const stock = Number(p.stock) || 0;
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-gray-100 overflow-hidden shrink-0">
                    <img src={p.image || `https://picsum.photos/seed/${encodeURIComponent(p.id)}/80/80`} alt={p.name} className="w-10 h-10 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{p.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{formatearMoneda(p.price)}</span>
                      {esVenta && (
                        <span className={stock === 0 ? 'text-red-500' : 'text-gray-400'}>
                          Stock: {stock}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => añadir(p)}
                    className="flex items-center gap-1 bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">Resumen del pedido</h3>

        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            Aún no hay productos en el pedido.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map(i => (
              <li key={i.key} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm truncate">{i.product.name}</div>
                  {!esVenta && (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={i.precio}
                      onChange={e => cambiarPrecio(i.key, e.target.value)}
                      onFocus={e => e.target.select()}
                      className="w-28 mt-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      title="Precio unitario de compra"
                    />
                  )}
                  <div className="text-emerald-600 font-bold text-sm">{formatearMoneda(i.precio * i.qty)}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => cambiarCantidad(i.key, i.qty - 1)}
                    disabled={i.qty <= 1}
                    className="w-8 h-8 rounded-lg border border-gray-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={i.qty}
                    onChange={e => cambiarCantidad(i.key, e.target.value)}
                    onFocus={e => e.target.select()}
                    className="w-12 text-center border border-gray-200 rounded-lg px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    aria-label="Cantidad"
                  />
                  <button
                    onClick={() => cambiarCantidad(i.key, i.qty + 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => quitar(i.key)}
                    className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 transition flex items-center justify-center"
                    aria-label="Quitar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm text-gray-400">Total: <span className="font-bold text-emerald-600">{formatearMoneda(total)}</span></div>
              <div className="text-xs text-gray-300">{cantidades} producto{cantidades !== 1 ? 's' : ''}</div>
            </div>
            <button
              onClick={confirmar}
              className="flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-5 py-2.5 font-semibold hover:bg-emerald-700 active:scale-95 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {esVenta ? 'Registrar venta' : 'Registrar compra'}
            </button>
          </div>
        )}

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>
    </section>
  );
}
