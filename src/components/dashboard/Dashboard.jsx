import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart, CreditCard, Users, AlertTriangle,
  ArrowUpLeft, ArrowDownLeft, Package, Wallet, ShoppingBag,
  Plus, Minus, Trash2, ChevronRight,
} from 'lucide-react';

function formatearMoneda(n, moneda = 'COP') {
  if (moneda === 'Bs') {
    return `Bs. ${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const formato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  if (!n && n !== 0) return formato.format(0);
  return formato.format(Number(n));
}

function formatearFecha(iso) {
  try {
    return new Date(iso).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function parseNumero(v) {
  if (v == null) return NaN;
  let s = String(v).trim().replace(/\s+/g, '');
  if (s.includes(',')) { s = s.replace(/\./g, '').replace(',', '.'); }
  else if (s.includes('.')) { const partes = s.split('.'); if (partes[partes.length - 1].length === 3) s = s.replace(/\./g, ''); }
  const n = parseFloat(s);
  return Number.isNaN(n) ? NaN : n;
}

function semanaDias() {
  const hoy = new Date();
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoy);
    dia.setDate(dia.getDate() - i);
    dias.push(dia.toISOString().slice(0, 10));
  }
  return dias;
}

function QuickAction({ icon: Icon, label, onClick, color, bg, hoverBorder }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm hover:shadow hover:${hoverBorder} active:scale-95 transition-all`}>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
    </button>
  );
}

function MountainChart({ data, maxVenta, hoy }) {
  const W = 320;
  const H = 140;
  const padL = 4;
  const padR = 4;
  const padT = 8;
  const padB = 22;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = data.length;
  const step = chartW / (n - 1 || 1);

  const toPath = (getter) => {
    const pts = data.map((d, i) => {
      const x = padL + i * step;
      const val = getter(d);
      const y = padT + chartH - (maxVenta > 0 ? (val / maxVenta) * chartH : 0);
      return { x, y };
    });
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${padT + chartH} L${pts[0].x.toFixed(1)},${padT + chartH} Z`;
    return { line, area, pts };
  };

  const cop = toPath(d => d.cop);
  const bs = toPath(d => d.bs);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto', maxHeight: '10rem' }}>
      <defs>
        <linearGradient id="gradCop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="gradBs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map(frac => {
        const y = padT + chartH - frac * chartH;
        return <line key={frac} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
      })}

      <path d={bs.area} fill="url(#gradBs)" />
      <path d={bs.line} fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={cop.area} fill="url(#gradCop)" />
      <path d={cop.line} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {cop.pts.map((p, i) => {
        const isToday = data[i].dia === hoy;
        if (!isToday) return null;
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="white" strokeWidth="2" />;
      })}
      {bs.pts.map((p, i) => {
        const isToday = data[i].dia === hoy;
        if (!isToday) return null;
        return <circle key={`bs-${i}`} cx={p.x} cy={p.y} r="4" fill="#94a3b8" stroke="white" strokeWidth="2" />;
      })}

      {data.map((d, i) => {
        const x = padL + i * step;
        const isToday = d.dia === hoy;
        return (
          <text key={i} x={x} y={H - 4} textAnchor="middle"
            className={`text-[8px] capitalize ${isToday ? 'fill-slate-700 font-bold' : 'fill-gray-400'}`}>
            {new Date(d.dia + 'T12:00:00').toLocaleDateString('es', { weekday: 'short' })}
          </text>
        );
      })}
    </svg>
  );
}

export default function Dashboard({ onNavigate }) {
  const {
    perfilActivo, movimientosGeneral, transaccionesBanco, fiados,
    fiadosPendientes, fiadosVencidos, totalPorCobrar, products,
    totalBancoHoy, totalBanco,
    agregarMovimientoGeneral, eliminarMovimientoGeneral,
  } = useApp();

  const [tipo, setTipo] = useState(null);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');

  const hoy = getTodayString();
  const nombre = perfilActivo?.nombre || 'Usuario';

  const { ingresosTotal, gastosTotal, saldoTotal } = useMemo(() => {
    let ingresos = 0, gastos = 0;
    movimientosGeneral.forEach(m => {
      const val = Number(m.monto) || 0;
      if (m.tipo === 'ingreso') ingresos += val; else gastos += val;
    });
    return { ingresosTotal: ingresos, gastosTotal: gastos, saldoTotal: ingresos - gastos };
  }, [movimientosGeneral]);

  const ventasHoy = useMemo(() => {
    return movimientosGeneral
      .filter(m => m.tipo === 'ingreso' && String(m.fecha || '').slice(0, 10) === hoy)
      .reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  }, [movimientosGeneral, hoy]);

  const ventasPorDia = useMemo(() => {
    const dias = semanaDias();
    const mapa = {};
    dias.forEach(d => mapa[d] = { cop: 0, bs: 0 });
    movimientosGeneral.forEach(m => {
      const dia = String(m.fecha || '').slice(0, 10);
      if (mapa[dia] !== undefined) {
        const val = Number(m.monto) || 0;
        mapa[dia].cop += m.tipo === 'gasto' ? -val : val;
      }
    });
    transaccionesBanco.forEach(t => {
      const dia = String(t.fecha || '').slice(0, 10);
      if (mapa[dia] !== undefined) {
        const val = Number(t.monto) || 0;
        mapa[dia].bs += t.tipo === 'gasto' ? -val : val;
      }
    });
    return dias.map(d => ({ dia: d, cop: mapa[d].cop, bs: mapa[d].bs }));
  }, [movimientosGeneral, transaccionesBanco]);

  const maxVenta = Math.max(...ventasPorDia.map(d => Math.max(d.cop, d.bs)), 1);

  const stockBajo = useMemo(() => {
    return products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 5).slice(0, 3);
  }, [products]);

  const alertas = [];
  if (fiadosVencidos.length > 0) alertas.push({ texto: `${fiadosVencidos.length} fiado${fiadosVencidos.length > 1 ? 's' : ''} vencido${fiadosVencidos.length > 1 ? 's' : ''}`, icono: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' });
  if (stockBajo.length > 0) alertas.push({ texto: `Stock bajo: ${stockBajo.map(p => p.name).join(', ')}`, icono: Package, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' });
  if (fiadosPendientes.length > 0) alertas.push({ texto: `${totalPorCobrar > 0 ? formatearMoneda(totalPorCobrar) : ''} por cobrar`, icono: Users, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' });

  const handleGuardar = async () => {
    if (!concepto.trim()) return alert('Escribe un concepto');
    const valor = parseNumero(monto);
    if (Number.isNaN(valor) || valor <= 0) return alert('Monto inválido');
    await agregarMovimientoGeneral({ tipo, concepto: concepto.trim(), monto: valor });
    setTipo(null);
    setConcepto('');
    setMonto('');
  };

  const handleEliminar = async (id) => {
    await eliminarMovimientoGeneral(id);
  };

  const dateObj = new Date();
  const fechaLarga = dateObj.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-5">

      <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
        <p className="text-[11px] text-gray-400 capitalize">{fechaLarga}</p>
        <h1 className="text-lg font-bold text-slate-800 mt-0.5">Hola, {nombre}</h1>
      </div>

      {/* ── Caja ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
        <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center justify-center gap-2 uppercase tracking-wide">
          <Wallet className="w-3.5 h-3.5" /> Caja
        </h3>

        <div className="mb-3">
          <div className="text-3xl font-extrabold tracking-tight text-slate-900">
            {saldoTotal >= 0 ? '+' : ''}{formatearMoneda(saldoTotal)}
          </div>
          <div className="flex justify-center gap-4 mt-1 text-xs text-gray-400">
            <span className="text-emerald-500">+{formatearMoneda(ingresosTotal)}</span>
            <span className="text-red-400">-{formatearMoneda(gastosTotal)}</span>
          </div>
        </div>

        {!tipo ? (
          <div className="flex gap-2 justify-center mb-3">
            <button onClick={() => { setTipo('ingreso'); setConcepto(''); setMonto(''); }}
              className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3.5 py-2 text-sm font-semibold hover:bg-emerald-100 active:scale-95 transition">
              <Plus className="w-3.5 h-3.5" /> Sumar
            </button>
            <button onClick={() => { setTipo('gasto'); setConcepto(''); setMonto(''); }}
              className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 rounded-lg px-3.5 py-2 text-sm font-semibold hover:bg-red-100 active:scale-95 transition">
              <Minus className="w-3.5 h-3.5" /> Restar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-3 max-w-sm mx-auto text-left">
            <input value={concepto} onChange={e => setConcepto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGuardar()}
              placeholder={tipo === 'ingreso' ? 'Concepto (ej. Conteo noche)' : 'Concepto (ej. Transporte, servicio)'}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" autoFocus />
            <div className="flex gap-2 items-center">
              <input type="text" inputMode="decimal" placeholder="0" value={monto}
                onChange={e => setMonto(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGuardar()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              <button onClick={handleGuardar}
                className={`${tipo === 'ingreso' ? 'bg-emerald-600' : 'bg-red-500'} text-white rounded-lg px-3 py-2 text-sm font-semibold hover:opacity-90 transition`}>
                OK
              </button>
              <button onClick={() => setTipo(null)}
                className="bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-200 transition">
                X
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Digital ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase tracking-wide">
          <CreditCard className="w-3.5 h-3.5" /> Digital
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{formatearMoneda(totalBanco, 'Bs')}</div>
            <span className="text-xs text-emerald-500">+{formatearMoneda(totalBancoHoy, 'Bs')} hoy</span>
          </div>
          <button onClick={() => onNavigate('bancos')}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 flex items-center gap-0.5 transition">
            Ver <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Últimos movimientos ── */}
      {movimientosGeneral.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">Últimos movimientos</h4>
          <ul className="flex flex-col gap-1 max-h-44 overflow-y-auto">
            {movimientosGeneral.map(m => {
              const esIngreso = m.tipo === 'ingreso';
              return (
                <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${esIngreso ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                    {esIngreso ? <ArrowUpLeft className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{m.concepto}</div>
                    <div className="text-[11px] text-gray-400">{formatearFecha(m.createdAt || m.fecha)}</div>
                  </div>
                  <span className={`font-semibold text-sm ${esIngreso ? 'text-emerald-600' : 'text-red-400'}`}>
                    {esIngreso ? '+' : '−'}{formatearMoneda(m.monto)}
                  </span>
                  <button onClick={() => handleEliminar(m.id)}
                    className="p-1 rounded text-gray-300 hover:text-red-400 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Resumen del día ── */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-2.5">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Ventas</p>
          <p className="text-base font-bold text-slate-700">{formatearMoneda(ventasHoy)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-2.5">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Digital</p>
          <p className="text-base font-bold text-slate-700">{formatearMoneda(totalBancoHoy, 'Bs')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-2.5">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Fiados</p>
          <p className="text-base font-bold text-slate-700">{formatearMoneda(totalPorCobrar)}</p>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <QuickAction icon={ShoppingCart} label="Venta" onClick={() => onNavigate('venta')} color="text-emerald-600" bg="bg-emerald-50" hoverBorder="hover:border-emerald-200" />
        <QuickAction icon={ShoppingBag} label="Compra" onClick={() => onNavigate('compra')} color="text-slate-600" bg="bg-slate-50" hoverBorder="hover:border-slate-200" />
        <QuickAction icon={CreditCard} label="Bancos" onClick={() => onNavigate('bancos')} color="text-slate-600" bg="bg-slate-50" hoverBorder="hover:border-slate-200" />
        <QuickAction icon={Users} label="Fiados" onClick={() => onNavigate('fiados')} color="text-slate-600" bg="bg-slate-50" hoverBorder="hover:border-slate-200" />
      </div>

      {/* ── Alertas ── */}
      {alertas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Alertas
          </h3>
          <ul className="flex flex-col gap-1.5">
            {alertas.map((a, i) => (
              <li key={i} className={`flex items-center gap-2 ${a.bg} border ${a.border} rounded-lg px-3 py-2`}>
                <a.icono className={`w-3.5 h-3.5 shrink-0 ${a.color}`} />
                <span className="text-sm font-medium text-slate-700">{a.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Ventas semana ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Ventas semana</h3>
        <MountainChart data={ventasPorDia} maxVenta={maxVenta} hoy={hoy} />
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> COP</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Bs</span>
        </div>
      </div>

    </section>
  );
}
