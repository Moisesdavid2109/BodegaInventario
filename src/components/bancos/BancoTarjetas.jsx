import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { subirComprobante } from '../../lib/firestore';
import { ArrowLeft, Camera, Trash2, CreditCard, Image as ImageIcon, List, ChevronDown, Plus, Minus, ArrowUpLeft, ArrowDownLeft } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

function formatearMoneda(n, moneda = 'COP') {
  if (moneda === 'Bs') {
    const val = Number(n) || 0;
    return `Bs. ${val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const formato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
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

function formatearFecha(iso) {
  try {
    return new Date(iso).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function getTodayString() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

const TIPOS = [
  { id: 'transferencia', label: 'Transferencia', color: 'blue', moneda: 'Bs' },
  { id: 'tarjeta_debito', label: 'Tarjeta Débito', color: 'indigo', moneda: 'Bs' },
];

export default function BancoTarjetas({ onVolver }) {
  const { transaccionesBanco, agregarTransaccionBanco, eliminarTransaccionBanco, perfilActivo } = useApp();
  const [mostrarLista, setMostrarLista] = useState(false);
  const [tipo, setTipo] = useState('transferencia');
  const [tipoMov, setTipoMov] = useState('ingreso');
  const [monto, setMonto] = useState('');
  const [cliente, setCliente] = useState('');
  const [comentario, setComentario] = useState('');
  const [fecha, setFecha] = useState(getTodayString());
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const fileRef = useRef();

  const tipoActual = TIPOS.find(t => t.id === tipo);
  const moneda = tipoActual?.moneda || 'Bs';

  const hoy = getTodayString();
  const totalHoyBs = transaccionesBanco
    .filter(t => String(t.fecha || '').slice(0, 10) === hoy)
    .reduce((s, t) => {
      const val = Number(t.monto) || 0;
      return s + (t.tipo === 'gasto' ? -val : val);
    }, 0);

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Máximo 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { setFoto(reader.result); setPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleGuardar = async () => {
    const montoNum = parseNumero(monto);
    if (Number.isNaN(montoNum) || montoNum <= 0) return alert('Monto inválido');
    if (!perfilActivo?.id) return alert('Error: no hay perfil activo');
    setGuardando(true);
    try {
      const docRef = await agregarTransaccionBanco({
        tipo: tipoMov, subtipo: tipo, monto: montoNum, moneda, fecha, cliente: cliente.trim() || null,
        comentario: comentario.trim() || null, comprobanteUrl: null,
      });
      setMonto(''); setCliente(''); setComentario(''); setFoto(null); setPreview(null);
      alert('Transacción guardada');
      if (foto && docRef?.id) {
        subirComprobante(perfilActivo.id, docRef.id, foto)
          .then(url => updateDoc(doc(db, 'transacciones_banco', docRef.id), { comprobanteUrl: url }))
          .catch(err => console.warn('Error subiendo comprobante:', err));
      }
    } catch (e) {
      console.error('Error banco:', e);
      alert('Error guardando: ' + e.message);
    }
    setGuardando(false);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await eliminarTransaccionBanco(id);
  };

  const resetForm = () => {
    setMonto(''); setCliente(''); setComentario(''); setFoto(null); setPreview(null);
  };

  return (
    <section className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-6">
      <button onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm hover:bg-slate-50 transition mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" /> Bancos y Tarjetas
        </h2>
        <button onClick={() => { setMostrarLista(!mostrarLista); resetForm(); }}
          className="flex items-center gap-1.5 bg-slate-100 text-slate-700 rounded-full px-4 py-2 text-sm font-semibold hover:bg-slate-200 active:scale-95 transition whitespace-nowrap">
          <List className="w-4 h-4" /> Ver transacciones
        </button>
      </div>

      {totalHoyBs > 0 && (
        <div className="bg-blue-50 text-blue-700 rounded-xl px-4 py-2.5 text-sm font-semibold mb-4 flex items-center justify-between">
          <span>Total hoy</span>
          <span>{formatearMoneda(totalHoyBs, 'Bs')}</span>
        </div>
      )}

      {mostrarLista ? (
        transaccionesBanco.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay transacciones registradas</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {transaccionesBanco.map(t => {
              const esIngreso = t.tipo === 'ingreso';
              const subtipo = t.subtipo || t.tipo || 'transferencia';
              const txnMoneda = t.moneda || 'Bs';
              return (
                <li key={t.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${esIngreso ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                        {esIngreso ? <ArrowUpLeft className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs text-gray-400">{formatearFecha(t.createdAt?.toDate?.() || t.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${esIngreso ? 'text-emerald-600' : 'text-red-400'}`}>
                        {esIngreso ? '+' : '−'}{formatearMoneda(t.monto, txnMoneda)}
                      </span>
                      <button onClick={() => handleEliminar(t.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {t.cliente && <p className="text-sm text-slate-600">{t.cliente}</p>}
                  {t.comentario && <p className="text-xs text-gray-400 mt-0.5">{t.comentario}</p>}
                  {t.comprobanteUrl && (
                    <a href={t.comprobanteUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-2">
                      <ImageIcon className="w-3 h-3" /> Ver comprobante
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Nueva transacción</h3>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setTipoMov('ingreso')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition border-2 ${
                tipoMov === 'ingreso' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'
              }`}>
              <Plus className="w-4 h-4" /> Sumar
            </button>
            <button onClick={() => setTipoMov('gasto')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition border-2 ${
                tipoMov === 'gasto' ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-100 text-gray-500 hover:border-gray-200'
              }`}>
              <Minus className="w-4 h-4" /> Restar
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => { setTipo(t.id); setMonto(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition border-2 ${
                  tipo === t.id ? `border-${t.color}-500 bg-${t.color}-50 text-${t.color}-700` : 'border-gray-100 text-gray-500 hover:border-gray-200'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 rounded-xl px-3 py-2 mb-4 text-xs text-slate-500 font-medium">
            Moneda: <span className="text-slate-700 font-bold">{moneda}</span> — Todos los montos en bolívares
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Monto ({moneda}) *</label>
              <input type="text" inputMode="decimal" value={monto} onChange={e => setMonto(e.target.value)}
                placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre del cliente (opcional)</label>
              <input type="text" value={cliente} onChange={e => setCliente(e.target.value)}
                placeholder="Ej: María López"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Comentario (opcional)</label>
              <input type="text" value={comentario} onChange={e => setComentario(e.target.value)}
                placeholder="Ej: Pago factura #123"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Comprobante (opcional)</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-6 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Comprobante" className="h-32 rounded-lg object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); setFoto(null); setPreview(null); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span className="text-sm">Adjuntar foto del comprobante</span>
                  </>
                )}
              </button>
            </div>

            <button onClick={handleGuardar} disabled={guardando}
              className="w-full bg-blue-600 text-white rounded-xl px-4 py-3 font-bold hover:bg-blue-700 active:scale-95 transition disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar transacción'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
