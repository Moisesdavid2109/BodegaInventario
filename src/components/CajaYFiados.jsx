import React, { useState } from 'react';
import { Plus, Minus, User, Users, Wallet, TrendingUp, TrendingDown, Receipt, Trash2, ArrowDownLeft, ArrowUpLeft, Lock } from 'lucide-react';

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

function totalDeuda(persona) {
  return (persona.debts || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);
}

function formatearFecha(iso) {
  try {
    return new Date(iso).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

export default function CajaYFiados({
  saldo = 0,
  resumenDiario = { ingresos: 0, gastos: 0 },
  people = [],
  onAgregarPersona,
  onAjustarDeuda,
  movimientos = [],
  onRegistrarMovimiento,
  onEliminarMovimiento,
}) {
  const [nombrePersona, setNombrePersona] = useState('');
  const [registro, setRegistro] = useState(null); // { tipo: 'ingreso' | 'gasto' } | null
  const [conceptoMov, setConceptoMov] = useState('');
  const [montoMov, setMontoMov] = useState('');
  const [montoDeuda, setMontoDeuda] = useState({ id: null, modo: null });
  const [valorDeuda, setValorDeuda] = useState('');

  const abrirRegistro = (tipo) => {
    setRegistro({ tipo });
    setConceptoMov('');
    setMontoMov('');
  };

  const confirmarRegistro = () => {
    if (!conceptoMov.trim()) return alert('Escribe un concepto');
    const valor = parseNumero(montoMov);
    if (Number.isNaN(valor) || valor <= 0) return alert('Monto inválido');
    onRegistrarMovimiento({ tipo: registro.tipo, concepto: conceptoMov.trim(), monto: valor });
    setRegistro(null);
    setConceptoMov('');
    setMontoMov('');
  };

  const agregarPersona = () => {
    if (!nombrePersona.trim()) return;
    onAgregarPersona(nombrePersona.trim());
    setNombrePersona('');
  };

  const confirmarDeuda = (persona) => {
    const valor = parseNumero(valorDeuda);
    if (Number.isNaN(valor) || valor <= 0) return alert('Monto inválido');
    const monto = montoDeuda.modo === 'add' ? Math.abs(valor) : -Math.abs(valor);
    onAjustarDeuda(persona.id, monto);
    setMontoDeuda({ id: null, modo: null });
    setValorDeuda('');
  };

  const inputStyles = "border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500";
  const esIngresoRegistro = registro?.tipo === 'ingreso';

  return (
    <section className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-5">
      <h2 className="text-lg font-bold text-slate-900">Gestor de cuentas</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
        <div className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1.5">
          <Wallet className="w-4 h-4" />
          Balance de Caja
        </div>
        <div className="text-4xl font-extrabold text-slate-900 tracking-tight break-all">
          {formatearMoneda(saldo)}
        </div>

        {!registro ? (
          <div className="flex gap-3 justify-center mt-4 flex-wrap">
            <button
              onClick={() => abrirRegistro('ingreso')}
              className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-full px-5 py-2.5 font-bold hover:bg-emerald-600 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              Registrar ingreso
            </button>
            <button
              onClick={() => abrirRegistro('gasto')}
              className="flex items-center gap-1.5 bg-red-500 text-white rounded-full px-5 py-2.5 font-bold hover:bg-red-600 active:scale-95 transition"
            >
              <Minus className="w-4 h-4" />
              Registrar gasto
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-4 max-w-md mx-auto">
            <input
              value={conceptoMov}
              onChange={e => setConceptoMov(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmarRegistro()}
              placeholder={esIngresoRegistro ? 'Concepto (ej. abono, reembolso)' : 'Concepto (ej. transporte, servicios)'}
              className={inputStyles}
              autoFocus
            />
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={montoMov}
                onChange={e => setMontoMov(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmarRegistro()}
                onFocus={e => e.target.select()}
                className={`${inputStyles} flex-1 min-w-0`}
              />
              <button
                onClick={confirmarRegistro}
                className={`${esIngresoRegistro ? 'bg-emerald-600' : 'bg-red-500'} text-white rounded-lg px-4 py-2.5 font-semibold hover:opacity-90 transition shrink-0`}
              >
                OK
              </button>
              <button
                onClick={() => setRegistro(null)}
                className="bg-slate-100 text-slate-600 rounded-lg px-4 py-2.5 font-semibold hover:bg-slate-200 transition shrink-0"
              >
                X
              </button>
            </div>
            <p className="text-xs text-gray-400 text-left">
              {esIngresoRegistro
                ? 'Se suma al balance y se cuenta como ingreso del día.'
                : 'Se descuenta del balance y queda registrado para tu control.'}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          Movimientos
        </h3>

        {movimientos.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm">No hay movimientos registrados.</div>
        ) : (
          <>
            {movimientos.length > 5 && (
              <p className="text-xs text-gray-400 mb-2">Mostrando los últimos 5 movimientos.</p>
            )}
            <ul className="flex flex-col gap-2">
              {movimientos.slice(0, 5).map(m => {
              const esIngreso = m.tipo === 'ingreso';
              return (
                <li key={m.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${esIngreso ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {esIngreso ? <ArrowUpLeft className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{m.concepto}</div>
                    <div className="text-xs text-gray-400">{formatearFecha(m.fecha)}</div>
                  </div>
                  <span className={`font-bold ${esIngreso ? 'text-emerald-600' : 'text-red-500'}`}>
                    {esIngreso ? '+' : '−'}{formatearMoneda(m.monto)}
                  </span>
                  {m.pedidoId ? (
                    <span className="p-1.5 text-gray-300" title="Registro automático de un pedido (gestiona en Historial)">
                      <Lock className="w-4 h-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => onEliminarMovimiento(m.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition"
                      aria-label="Eliminar movimiento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
            </ul>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3">Resumen Diario</h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-gray-500">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Ingresos Hoy
            </span>
            <span className="text-emerald-600 font-bold">{formatearMoneda(resumenDiario?.ingresos ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-gray-500">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Gastos Hoy
            </span>
            <span className="text-red-500 font-bold">{formatearMoneda(resumenDiario?.gastos ?? 0)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Deudas (Fiado)
        </h3>

        <div className="flex gap-2 mb-4">
          <input
            value={nombrePersona}
            onChange={e => setNombrePersona(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarPersona()}
            placeholder="Nombre de la persona"
            className={`${inputStyles} flex-1`}
          />
          <button
            onClick={agregarPersona}
            className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-lg px-4 py-2.5 font-semibold whitespace-nowrap hover:bg-emerald-700 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            Añadir persona
          </button>
        </div>

        {people.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No hay personas registradas.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {people.map(p => {
              const esEditable = montoDeuda.id === p.id;
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-emerald-600 font-bold">{formatearMoneda(totalDeuda(p))}</div>
                  </div>

                  {!esEditable ? (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => { setMontoDeuda({ id: p.id, modo: 'add' }); setValorDeuda(''); }}
                        className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition"
                        aria-label={`Agregar deuda a ${p.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setMontoDeuda({ id: p.id, modo: 'sub' }); setValorDeuda(''); }}
                        className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-95 transition"
                        aria-label={`Restar deuda a ${p.name}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 shrink-0 items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={valorDeuda}
                        onChange={e => setValorDeuda(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmarDeuda(p)}
                        onFocus={e => e.target.select()}
                        className={`${inputStyles} w-24`}
                        autoFocus
                      />
                      <button
                        onClick={() => confirmarDeuda(p)}
                        className="bg-emerald-600 text-white rounded-lg px-3 py-2 font-semibold hover:bg-emerald-700 transition"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setMontoDeuda({ id: null, modo: null })}
                        className="bg-slate-100 text-slate-600 rounded-lg px-3 py-2 font-semibold hover:bg-slate-200 transition"
                      >
                        X
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
