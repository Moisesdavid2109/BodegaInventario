import React, { useMemo, useState } from 'react';
import { History, ArrowLeft, ShoppingCart, PackagePlus, User, Truck, Undo2 } from 'lucide-react';

function formatearMoneda(n) {
  const formato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  if (!n && n !== 0) return formato.format(0);
  return formato.format(Number(n));
}

function formatearFecha(iso) {
  try {
    return new Date(iso).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

export default function Historial({ pedidos = [], clientes = [], onVolver, onDeshacer }) {
  const [filtro, setFiltro] = useState('todos'); // todos | venta | compra

  const visibles = useMemo(() => {
    if (filtro === 'todos') return pedidos;
    return pedidos.filter(p => p.tipo === filtro);
  }, [pedidos, filtro]);

  const nombrePersona = (id) => {
    if (!id) return '';
    const c = (clientes || []).find(x => x.id === id);
    return c ? c.nombre : '';
  };

  return (
    <section className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-6">
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          Historial de pedidos
        </h2>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl text-sm">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'venta', label: 'Ventas' },
            { id: 'compra', label: 'Compras' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFiltro(t.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filtro === t.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="neu rounded-2xl p-5">
        {visibles.length === 0 ? (
          <div className="text-center text-gray-400 py-10">Aún no hay pedidos guardados.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibles.map(p => {
              const esVenta = p.tipo === 'venta';
              const fiado = nombrePersona(p.fiadoPersonaId);
              return (
                <li key={p.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${esVenta ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'}`}>
                        {esVenta ? <ShoppingCart className="w-3 h-3" /> : <PackagePlus className="w-3 h-3" />}
                        {esVenta ? 'Venta' : 'Compra'}
                      </span>
                      <span className="text-xs text-gray-400">{formatearFecha(p.fecha)}</span>
                    </div>
                    <span className={`font-bold ${esVenta ? 'text-sky-600' : 'text-violet-600'}`}>{formatearMoneda(p.total)}</span>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {p.items.map(it => (
                      <li key={it.product.id} className="flex justify-between text-sm text-slate-700">
                        <span className="truncate pr-3">{it.product.name} × {it.qty}</span>
                        <span className="shrink-0 text-gray-500">{formatearMoneda((it.precio || it.product.price || 0) * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  {fiado && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Fiado: {fiado}
                    </div>
                  )}
                  {!esVenta && p.proveedor && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Proveedor: {p.proveedor}
                    </div>
                  )}
                  {onDeshacer && (
                    <div className="mt-2 flex justify-end border-t border-gray-50 pt-2">
                      <button
                        onClick={() => onDeshacer(p.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition"
                        title="Revertir stock, caja y resumen de este pedido"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Deshacer
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
