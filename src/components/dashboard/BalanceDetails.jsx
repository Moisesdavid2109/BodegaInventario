import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowDownLeft, ArrowUpRight, ArrowLeft, Send, Wallet, CheckCircle2, X } from 'lucide-react';

function formatearMoneda(n, moneda = 'COP') {
  if (moneda === 'Bs') {
    return `Bs. ${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const formato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2, minimumFractionDigits: 2 });
  return formato.format(Number(n) || 0);
}

function parseNumero(v) {
  if (v == null) return NaN;
  let s = String(v).trim().replace(/\s+/g, '');
  if (s.includes(',')) { s = s.replace(/\./g, '').replace(',', '.'); }
  else if (s.includes('.')) { const partes = s.split('.'); if (partes[partes.length - 1].length === 3) s = s.replace(/\./g, ''); }
  const n = parseFloat(s);
  return Number.isNaN(n) ? NaN : n;
}

export default function BalanceDetails() {
  const { ingresosTotales, gastosTotales, ingresosHoy, gastosHoy, transaccionesBanco, agregarMovimientoGeneral } = useApp();
  const [tipo, setTipo] = useState(null); // null | 'ingreso' | 'gasto'
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);

  const saldo = (ingresosTotales || 0) - (gastosTotales || 0);

  const totalBs = (transaccionesBanco || []).reduce((s, t) => {
    if ((t.moneda || 'Bs') !== 'Bs') return s;
    const m = Number(t.monto) || 0;
    return s + (t.tipo === 'ingreso' ? m : -m);
  }, 0);

  const abrir = (t) => { setTipo(t); setConcepto(''); setMonto(''); };

  const guardar = async () => {
    if (!concepto.trim()) return alert('Escribe un concepto');
    const valor = parseNumero(monto);
    if (Number.isNaN(valor) || valor <= 0) return alert('Monto inválido');
    setGuardando(true);
    try {
      await agregarMovimientoGeneral({ tipo, concepto: concepto.trim(), monto: valor });
      setTipo(null); setConcepto(''); setMonto('');
    } catch (e) {
      alert('Error al guardar: ' + (e.message || 'Revisa la consola'));
    }
    setGuardando(false);
  };

  return (
    <section className="neu rounded-3xl p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-slate-400 uppercase">Detalles del Balance</h2>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 rounded-full px-2.5 py-1 uppercase tracking-wider">COP · Caja</span>
      </div>

      <div>
        <div className={`text-4xl sm:text-6xl font-extrabold tracking-tight ${saldo >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
          {saldo >= 0 ? '' : '−'}{formatearMoneda(Math.abs(saldo)).replace('COP', '').trim()}
        </div>
        <div className="mt-1.5 text-sm text-slate-400 flex items-center flex-wrap gap-x-2">
          <span>Ingresos hoy <span className="font-bold text-emerald-600">+{formatearMoneda(ingresosHoy || 0)}</span></span>
          <span>·</span>
          <span>Gastos hoy <span className="font-bold text-rose-500">−{formatearMoneda(gastosHoy || 0)}</span></span>
        </div>
        <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
          <span>Total en Bs:</span>
          <span className="font-bold text-slate-600">{formatearMoneda(totalBs, 'Bs')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200/60 p-3.5 shadow-[inset_0_-3px_8px_rgba(147,197,253,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-widest">Ingresos</span>
            <span className="w-7 h-7 rounded-full bg-sky-500/15 text-sky-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-extrabold text-sky-800">{formatearMoneda(ingresosHoy || 0)}</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200/60 p-3.5 shadow-[inset_0_-3px_8px_rgba(196,181,253,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-violet-700 uppercase tracking-widest">Gastos</span>
            <span className="w-7 h-7 rounded-full bg-violet-500/15 text-violet-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-extrabold text-violet-800">{formatearMoneda(gastosHoy || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => abrir('ingreso')}
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-sky-400 to-sky-500 text-white rounded-2xl px-4 py-3.5 text-sm font-extrabold tracking-widest uppercase shadow-[0_10px_20px_rgba(56,189,248,0.4)] hover:brightness-105 active:scale-95 transition">
          <Wallet className="w-4 h-4" /> Recibir
        </button>
        <button onClick={() => abrir('gasto')}
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-2xl px-4 py-3.5 text-sm font-extrabold tracking-widest uppercase shadow-[0_10px_20px_rgba(30,64,175,0.4)] hover:brightness-110 active:scale-95 transition">
          <Send className="w-4 h-4" /> Enviar
        </button>
      </div>

      {tipo && (
        <div className="neu-inset rounded-2xl p-3.5 flex flex-col gap-2.5 animate-[fadeIn_.2s_ease]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
            {tipo === 'ingreso'
              ? <><ArrowDownLeft className="w-4 h-4 text-sky-500" /> Registrar ingreso (caja)</>
              : <><ArrowUpRight className="w-4 h-4 text-violet-500" /> Registrar gasto (caja)</>}
          </div>
          <input value={concepto} onChange={e => setConcepto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guardar()}
            placeholder={tipo === 'ingreso' ? 'Concepto (ej. conteo noche, venta)' : 'Concepto (ej. transporte, servicio)'}
            autoFocus
            className="w-full bg-white/80 border border-white/70 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          <div className="flex gap-2 items-center">
            <input type="text" inputMode="decimal" placeholder="0,00" value={monto}
              onChange={e => setMonto(e.target.value)} onKeyDown={e => e.key === 'Enter' && guardar()}
              className="flex-1 bg-white/80 border border-white/70 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            <button onClick={guardar} disabled={guardando}
              className={`flex items-center gap-1.5 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${tipo === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'}`}>
              <CheckCircle2 className="w-4 h-4" /> OK
            </button>
            <button onClick={() => setTipo(null)}
              className="neu-btn rounded-xl px-3 py-2.5 text-slate-500 hover:text-slate-700 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
        El saldo corresponde a los movimientos de caja del día de hoy.
      </p>
    </section>
  );
}