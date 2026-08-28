import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet, ArrowLeft, Plus, Minus, Trash2,
  ArrowUpLeft, ArrowDownLeft,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

function formatearMoneda(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);
}

function parseNumero(v) {
  if (v == null) return NaN;
  let s = String(v).trim().replace(/\s+/g, '');
  if (s.includes(',')) { s = s.replace(/\./g, '').replace(',', '.'); }
  else if (s.includes('.')) { const partes = s.split('.'); if (partes[partes.length - 1].length === 3) s = s.replace(/\./g, ''); }
  const n = parseFloat(s);
  return Number.isNaN(n) ? NaN : n;
}

function limpiarObj(obj) {
  const limpio = {};
  for (const [k, v] of Object.entries(obj)) { if (v !== undefined) limpio[k] = v; }
  return limpio;
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatearFecha(fecha) {
  try {
    if (fecha?.toDate) fecha = fecha.toDate().toISOString();
    return new Date(fecha).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function ControlGeneral({ onVolver }) {
  const { perfilActivo } = useApp();
  const perfilId = perfilActivo?.id;

  const [movimientos, setMovimientos] = useState([]);
  const [tipo, setTipo] = useState(null);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');

  useEffect(() => {
    if (!perfilId) return;
    const hoy = getTodayString();
    const q = query(collection(db, 'control_general'), where('perfilId', '==', perfilId));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      const hoyItems = items.filter(m => String(m.fecha || '').slice(0, 10) === hoy);
      hoyItems.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setMovimientos(hoyItems);
    }, (err) => console.error('Error escuchando control general:', err));
  }, [perfilId]);

  const total = useMemo(() => {
    return movimientos.reduce((s, m) => {
      return s + (m.tipo === 'ingreso' ? (Number(m.monto) || 0) : -(Number(m.monto) || 0));
    }, 0);
  }, [movimientos]);

  const ingresos = useMemo(() => movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + (Number(m.monto) || 0), 0), [movimientos]);
  const gastos = useMemo(() => movimientos.filter(m => m.tipo === 'gasto').reduce((s, m) => s + (Number(m.monto) || 0), 0), [movimientos]);

  const handleGuardar = async () => {
    if (!concepto.trim()) return alert('Escribe un concepto');
    const valor = parseNumero(monto);
    if (Number.isNaN(valor) || valor <= 0) return alert('Monto inválido');
    await addDoc(collection(db, 'control_general'), limpiarObj({
      perfilId,
      fecha: getTodayString(),
      tipo,
      concepto: concepto.trim(),
      monto: valor,
      createdAt: serverTimestamp(),
    }));
    setTipo(null);
    setConcepto('');
    setMonto('');
  };

  const handleEliminar = async (id) => {
    await deleteDoc(doc(db, 'control_general', id));
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-5 pb-28">
      <button onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm hover:bg-slate-50 transition mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-emerald-600" /> Control General
      </h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center mb-4">
        <div className="text-sm text-gray-400 mb-1">Balance del día</div>
        <div className={`text-4xl font-extrabold tracking-tight ${total >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {total >= 0 ? '+' : ''}{formatearMoneda(total)}
        </div>
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-400">
          <span className="text-emerald-600">+{formatearMoneda(ingresos)}</span>
          <span className="text-red-500">-{formatearMoneda(gastos)}</span>
        </div>

        {!tipo ? (
          <div className="flex gap-3 justify-center mt-4 flex-wrap">
            <button onClick={() => { setTipo('ingreso'); setConcepto(''); setMonto(''); }}
              className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-full px-5 py-2.5 font-bold hover:bg-emerald-600 active:scale-95 transition">
              <Plus className="w-4 h-4" /> Sumar
            </button>
            <button onClick={() => { setTipo('gasto'); setConcepto(''); setMonto(''); }}
              className="flex items-center gap-1.5 bg-red-500 text-white rounded-full px-5 py-2.5 font-bold hover:bg-red-600 active:scale-95 transition">
              <Minus className="w-4 h-4" /> Restar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-4 max-w-md mx-auto">
            <input value={concepto} onChange={e => setConcepto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGuardar()}
              placeholder={tipo === 'ingreso' ? 'Concepto (ej. venta, abono)' : 'Concepto (ej. transporte, servicio)'}
              className="border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" autoFocus />
            <div className="flex gap-2 items-center">
              <input type="text" inputMode="decimal" placeholder="0" value={monto}
                onChange={e => setMonto(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGuardar()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
              <button onClick={handleGuardar}
                className={`${tipo === 'ingreso' ? 'bg-emerald-600' : 'bg-red-500'} text-white rounded-lg px-4 py-2.5 font-semibold hover:opacity-90 transition`}>
                OK
              </button>
              <button onClick={() => setTipo(null)}
                className="bg-slate-100 text-slate-600 rounded-lg px-4 py-2.5 font-semibold hover:bg-slate-200 transition">
                X
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-slate-900 mb-3 text-sm">Movimientos de hoy</h3>
        {movimientos.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm">Sin movimientos registrados</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {movimientos.map(m => {
              const esIngreso = m.tipo === 'ingreso';
              return (
                <li key={m.id} className="flex items-center gap-3 border border-gray-50 rounded-xl px-3 py-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${esIngreso ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {esIngreso ? <ArrowUpLeft className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{m.concepto}</div>
                    <div className="text-xs text-gray-400">{formatearFecha(m.createdAt || m.fecha)}</div>
                  </div>
                  <span className={`font-bold text-sm ${esIngreso ? 'text-emerald-600' : 'text-red-500'}`}>
                    {esIngreso ? '+' : '−'}{formatearMoneda(m.monto)}
                  </span>
                  <button onClick={() => handleEliminar(m.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
