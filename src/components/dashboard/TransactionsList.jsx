import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';

function formatearCOPMonto(n, signo = '+') {
  const val = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(n) || 0);
  return `${signo === '-' ? '−' : '+'}${val}`;
}

function formatearFecha(iso) {
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

export default function TransactionsList({ onNavigate }) {
  const { movimientosGeneral } = useApp();

  const items = useMemo(() => {
    return (movimientosGeneral || [])
      .slice()
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      .slice(0, 5)
      .map(m => ({
        id: m.id,
        fecha: m.createdAt || m.fecha,
        recibido: m.tipo === 'ingreso',
        etiqueta: m.tipo === 'ingreso' ? 'Ingreso de caja' : 'Gasto de caja',
        detalle: m.concepto || 'Movimiento de caja',
        montoSigno: m.tipo === 'ingreso' ? '+' : '-',
        monto: m.monto,
      }));
  }, [movimientosGeneral]);

  return (
    <section className="neu rounded-3xl p-4 sm:p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-extrabold tracking-wide text-slate-800 uppercase">Transacciones de caja</h2>
        <button onClick={() => onNavigate?.('caja')}
          className="flex items-center gap-0.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition">
          Ver más <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aún no hay transacciones de caja.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((it, idx) => (
            <li key={it.id}
              className={`flex items-center gap-3 py-3 ${idx !== items.length - 1 ? 'border-b border-slate-100/80' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                it.recibido ? 'bg-emerald-50 text-emerald-500' : 'bg-violet-50 text-violet-500'
              }`}>
                {it.recibido ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">{it.etiqueta}</div>
                <div className="text-[11px] text-slate-400 truncate">{it.detalle}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`font-extrabold text-sm ${it.recibido ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {formatearCOPMonto(it.monto, it.montoSigno)}
                </div>
                <div className="text-[10px] text-slate-400">{formatearFecha(it.fecha)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}