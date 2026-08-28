import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Wallet, ArrowLeft, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

function formatearMoneda(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(n) || 0);
}

function formatearFecha(fecha) {
  if (typeof fecha?.toMillis === 'function') {
    return fecha.toDate().toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  try {
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

export default function CajaHistorial({ onVolver }) {
  const { movimientosGeneral, ingresosTotales, gastosTotales, eliminarMovimientoGeneral } = useApp();

  const saldo = (ingresosTotales || 0) - (gastosTotales || 0);

  const items = useMemo(() => {
    return (movimientosGeneral || [])
      .slice()
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [movimientosGeneral]);

  const eliminar = (m) => {
    if (confirm(`¿Eliminar "${m.concepto || 'movimiento'}" por ${formatearMoneda(m.monto)}?`)) {
      eliminarMovimientoGeneral(m.id).catch(() => alert('Error al eliminar'));
    }
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
          <Wallet className="w-5 h-5 text-blue-600" />
          Caja (historial completo)
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="neu rounded-2xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saldo</div>
          <div className={`text-sm sm:text-base font-extrabold mt-0.5 ${saldo >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
            {formatearMoneda(saldo)}
          </div>
        </div>
        <div className="neu rounded-2xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ingresos</div>
          <div className="text-sm sm:text-base font-extrabold mt-0.5 text-emerald-600">{formatearMoneda(ingresosTotales || 0)}</div>
        </div>
        <div className="neu rounded-2xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gastos</div>
          <div className="text-sm sm:text-base font-extrabold mt-0.5 text-rose-500">{formatearMoneda(gastosTotales || 0)}</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="neu rounded-3xl p-6 text-center text-sm text-slate-400">
          No hay movimientos de caja todavía.
        </div>
      ) : (
        <ul className="neu rounded-3xl p-2 flex flex-col">
          {items.map((m, idx) => {
            const recibe = m.tipo === 'ingreso';
            return (
              <li key={m.id}
                className={`flex items-center gap-3 py-3 px-2 ${idx !== items.length - 1 ? 'border-b border-slate-100/80' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  recibe ? 'bg-emerald-50 text-emerald-500' : 'bg-violet-50 text-violet-500'
                }`}>
                  {recibe ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{m.concepto || 'Movimiento de caja'}</div>
                  <div className="text-[11px] text-slate-400">{formatearFecha(m.fecha || m.createdAt)}</div>
                </div>
                <div className={`font-extrabold text-sm shrink-0 ${recibe ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {recibe ? '+' : '−'}{formatearMoneda(m.monto)}
                </div>
                <button onClick={() => eliminar(m)} aria-label="Eliminar movimiento"
                  className="text-slate-300 hover:text-red-500 transition shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}