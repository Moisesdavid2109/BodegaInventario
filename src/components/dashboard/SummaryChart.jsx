import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const W = 560;
const H = 230;
const padL = 12;
const padR = 12;
const padT = 16;
const padB = 36;
const chartW = W - padL - padR;
const chartH = H - padT - padB;

const PERIODOS = [
  { id: 'D', label: 'D' },
  { id: 'W', label: 'S' },
  { id: 'M', label: 'M' },
  { id: '6M', label: '6M' },
];

function formatearMoneda(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(n) || 0);
}

function toFecha(fecha) {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;
  if (typeof fecha.toDate === 'function') return fecha.toDate();
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
    const [y, m, d] = String(fecha).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
}

function isoDia(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function crearBuckets(periodo) {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const buckets = [];

  if (periodo === 'D' || periodo === 'M') {
    const n = periodo === 'D' ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const label = periodo === 'D'
        ? d.toLocaleDateString('es', { weekday: 'short' }).slice(0, 3)
        : String(d.getDate());
      buckets.push({ key: isoDia(d), label });
    }
  } else if (periodo === 'W') {
    for (let i = 7; i >= 0; i--) {
      const monday = new Date(hoy);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - i * 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const mesA = monday.toLocaleDateString('es', { month: 'short' });
      const mesB = sunday.toLocaleDateString('es', { month: 'short' });
      buckets.push({
        key: isoDia(monday),
        label: `${monday.getDate()}–${sunday.getDate()}${mesA !== mesB ? ` ${mesA}` : ''}`,
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('es', { month: 'short' }).slice(0, 3),
      });
    }
  }
  return buckets;
}

function keyDe(periodo, d) {
  if (!d) return null;
  if (periodo === '6M') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (periodo === 'W') {
    const monday = new Date(d);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return isoDia(monday);
  }
  return isoDia(d);
}

export default function SummaryChart() {
  const { pedidos, transaccionesBanco, movimientosGeneral } = useApp();
  const [periodo, setPeriodo] = useState('D');
  const [sel, setSel] = useState(null);

  const { series, max } = useMemo(() => {
    const lista = crearBuckets(periodo);
    const map = {};
    lista.forEach(b => { map[b.key] = { income: 0, expense: 0 }; });

    const add = (key, tipo, monto) => {
      if (!map[key]) return;
      const val = Number(monto) || 0;
      if (tipo === 'ingreso' || tipo === 'venta') map[key].income += val;
      else if (tipo === 'gasto' || tipo === 'compra') map[key].expense += val;
    };

    const pedidosEnCaja = new Set((movimientosGeneral || []).map(m => m.pedidoId).filter(Boolean));
    (pedidos || []).forEach(p => {
      if (pedidosEnCaja.has(p.id)) return;
      add(keyDe(periodo, toFecha(p.fecha)), p.tipo, p.total);
    });
    (transaccionesBanco || []).forEach(t => add(keyDe(periodo, toFecha(t.fecha || t.createdAt)), t.tipo, t.monto));
    (movimientosGeneral || []).forEach(m => add(keyDe(periodo, toFecha(m.fecha)), m.tipo, m.monto));

    const serie = lista.map(b => ({ ...b, ...map[b.key] }));
    const maxVal = Math.max(1, ...serie.flatMap(s => [s.income, s.expense]));
    return { series: serie, max: maxVal };
  }, [pedidos, transaccionesBanco, movimientosGeneral, periodo]);

  const n = series.length;

  useEffect(() => {
    setSel(s => (s == null ? n - 1 : Math.min(s, n - 1)));
  }, [n]);

  const groupW = chartW / n;
  const barW = Math.max(3, groupW * 0.26);
  const gapX = barW * 0.5;

  const centro = (i) => padL + i * groupW + groupW / 2;
  const alto = (v) => ((v || 0) / max) * chartH;
  const yBase = padT + chartH;

  const mover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xView = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.min(n - 1, Math.max(0, Math.floor((xView - padL) / groupW)));
    setSel(i);
  };

  const tooltipPct = sel != null ? Math.min(86, Math.max(14, (centro(sel) / W) * 100)) : 0;
  const itemSel = sel != null ? series[sel] : series[n - 1];

  return (
    <section className="neu rounded-3xl p-4 sm:p-5 flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-extrabold tracking-wide text-slate-800 uppercase">Resumen</h2>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Ingresos</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Gastos</span>
          </div>
        </div>
        <div className="flex gap-1 p-1 neu-inset rounded-xl">
          {PERIODOS.map(p => (
            <button key={p.id} onClick={() => { setPeriodo(p.id); setSel(prev => prev ?? n - 1); }}
              className={`w-9 h-7 rounded-lg text-xs font-bold transition ${
                periodo === p.id ? 'bg-blue-600 text-white shadow-[0_4px_10px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:text-blue-600'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 flex flex-col justify-center">
        {sel != null && itemSel && (
          <div className="absolute z-10 pointer-events-none"
            style={{ left: `${tooltipPct}%`, top: '0px', transform: 'translateX(-50%)' }}>
            <div className="bg-slate-800 text-white rounded-xl px-3.5 py-2.5 shadow-xl min-w-[168px]">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-slate-300">Ingresos:</span>
                <span className="font-bold text-sky-300">{formatearMoneda(itemSel.income)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] mt-0.5">
                <span className="text-slate-300">Gastos:</span>
                <span className="font-bold text-violet-300">{formatearMoneda(itemSel.expense)}</span>
              </div>
              <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-slate-800 rotate-45 -translate-x-1/2" />
            </div>
          </div>
        )}

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px] sm:h-[240px] cursor-crosshair"
          onMouseMove={mover}
          onMouseLeave={() => setSel(null)}
          onMouseEnter={() => setSel(prev => (itemSel ? (prev != null ? prev : n - 1) : null))}>
          {[0, 0.25, 0.5, 0.75, 1].map(frac => {
            const y = padT + chartH - frac * chartH;
            return <line key={frac} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeWidth="1"
              strokeDasharray={frac === 0 ? '' : '4 5'} strokeLinecap="round" />;
          })}

          {series.map((s, i) => {
            const c = centro(i);
            const incH = alto(s.income);
            const expH = alto(s.expense);
            return (
              <g key={s.key}>
                <rect x={c - barW - gapX / 2} y={yBase - incH} width={barW} height={incH} rx="3.5" fill="#38bdf8" opacity="0.95" />
                <rect x={c + gapX / 2} y={yBase - expH} width={barW} height={expH} rx="3.5" fill="#7c3aed" opacity="0.92" />
              </g>
            );
          })}

          {sel != null && (
            <line x1={centro(sel)} y1={padT} x2={centro(sel)} y2={padT + chartH}
              stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(100,116,139,0.5))' }} />
          )}

          {series.map((s, i) => (
            <text key={`t-${s.key}`} x={centro(i)} y={H - 10} textAnchor="middle"
              className="text-[9px] capitalize fill-slate-400 font-medium">
              {s.label}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}