import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';

function formatearCOPMonto(n, signo = '+') {
  const val = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(n) || 0);
  return `${signo === '-' ? '−' : '+'}${val}`;
}

function formatearBsMonto(n, signo = '+') {
  const val = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
  return `${signo === '-' ? '−' : '+'}${val} Bs`;
}

function formatearFecha(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function ts(valor) {
  if (typeof valor?.toMillis === 'function') return valor.toMillis();
  const d = new Date(valor);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export default function TransactionsList({ onNavigate }) {
  const { movimientosGeneral, transaccionesBanco } = useApp();

  const items = useMemo(() => {
    const caja = (movimientosGeneral || []).map(m => ({
      id: `caja-${m.id}`,
      fecha: m.createdAt || m.fecha,
      recibido: m.tipo === 'ingreso',
      etiqueta: m.tipo === 'ingreso' ? 'Recibido COP' : 'Enviado COP',
      detalle: m.concepto || 'Movimiento de caja',
      montoSigno: m.tipo === 'ingreso' ? '+' : '-',
      esBs: false,
      monto: m.monto,
    }));
    const banco = (transaccionesBanco || []).map(t => ({
      id: `banco-${t.id}`,
      fecha: t.createdAt || t.fecha,
      recibido: t.tipo === 'ingreso',
      etiqueta: t.tipo === 'ingreso' ? 'Recibido Bs' : 'Enviado Bs',
      detalle: t.cliente || t.comentario || (t.subtipo === 'tarjeta_debito' ? 'Tarjeta débito' : 'Transferencia'),
      montoSigno: t.tipo === 'ingreso' ? '+' : '-',
      esBs: true,
      monto: t.monto,
    }));
    return [...caja, ...banco]
      .sort((a, b) => ts(b.fecha) - ts(a.fecha))
      .slice(0, 5);
  }, [movimientosGeneral, transaccionesBanco]);

  return (
    <section className="neu rounded-3xl p-4 sm:p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-extrabold tracking-wide text-slate-800 uppercase">Transacciones</h2>
        <button onClick={() => onNavigate?.('historial')}
          className="flex items-center gap-0.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition">
          Ver más <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aún no hay transacciones.</p>
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
                  {it.esBs ? formatearBsMonto(it.monto, it.montoSigno) : formatearCOPMonto(it.monto, it.montoSigno)}
                </div>
                <div className="text-[10px] text-slate-400">{formatearFecha(it.fecha?.toDate?.() || it.fecha)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}