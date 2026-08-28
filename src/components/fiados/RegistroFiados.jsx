import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus, ArrowLeft, User, Users, Trash2, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, Calendar, Phone
} from 'lucide-react';

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

function getTodayString() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

function formatearFechaLarga(iso) {
  try { return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

export default function RegistroFiados({ onVolver }) {
  const { fiados, clientes, crearCliente, eliminarCliente, registrarPagoFiado } = useApp();
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
  const [expandedCliente, setExpandedCliente] = useState(null);
  const [expandedFiado, setExpandedFiado] = useState(null);
  const [mostrarPago, setMostrarPago] = useState(null);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [valorPago, setValorPago] = useState('');

  const hoy = getTodayString();

  const handleCrearCliente = async () => {
    if (!nombre.trim()) return alert('Escribe el nombre del cliente');
    await crearCliente({
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
    });
    setNombre(''); setTelefono(''); setMostrarFormCliente(false);
  };

  const handleEliminarCliente = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    await eliminarCliente(id);
  };

  const handlePago = async (fiadoId) => {
    const monto = parseNumero(valorPago);
    if (Number.isNaN(monto) || monto <= 0) return alert('Monto inválido');
    await registrarPagoFiado(fiadoId, monto);
    setMostrarPago(null);
    setValorPago('');
  };

  const fiadosPorCliente = {};
  fiados.forEach(f => {
    const cid = f.clienteId;
    if (!cid) return;
    if (!fiadosPorCliente[cid]) fiadosPorCliente[cid] = [];
    fiadosPorCliente[cid].push(f);
  });

  return (
    <section className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-6">
      <button onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm hover:bg-slate-50 transition mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" /> Fiados
        </h2>
        <button onClick={() => setMostrarFormCliente(true)}
          className="flex items-center gap-1.5 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-full px-4 py-2 text-sm font-semibold hover:brightness-105 active:scale-95 transition whitespace-nowrap">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      {mostrarFormCliente && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Registrar cliente</h3>
          <div className="flex flex-col gap-3">
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del cliente" autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
            <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="Teléfono (opcional)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
            <div className="flex gap-2">
              <button onClick={() => { setMostrarFormCliente(false); setNombre(''); setTelefono(''); }}
                className="flex-1 bg-slate-100 text-slate-600 rounded-xl py-2.5 font-semibold text-sm hover:bg-slate-200 transition">
                Cancelar
              </button>
              <button onClick={handleCrearCliente}
                className="flex-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:brightness-105 transition">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {clientes.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay clientes registrados</p>
          <p className="text-gray-300 text-xs mt-1">Registra un cliente para empezar a crear fiados desde las ventas</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {clientes.map(c => {
            const fiadosCliente = fiadosPorCliente[c.id] || [];
            const pendientes = fiadosCliente.filter(f => f.estado === 'pendiente');
            const pagados = fiadosCliente.filter(f => f.estado === 'pagado');
            const totalAdeuda = pendientes.reduce((s, f) => s + ((Number(f.montoTotal) || 0) - (Number(f.montoPagado) || 0)), 0);
            const totalPagadoHistorial = pagados.reduce((s, f) => s + (Number(f.montoTotal) || 0), 0);
            const expandiendo = expandedCliente === c.id;

            return (
              <li key={c.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => setExpandedCliente(expandiendo ? null : c.id)}
                  className="w-full flex items-center gap-3 p-4 text-left">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                    totalAdeuda > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{c.nombre}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      {c.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefono}</span>}
                      <span>{fiadosCliente.length} fiado{fiadosCliente.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {totalAdeuda > 0 ? (
                      <>
                        <div className="font-bold text-amber-600">{formatearMoneda(totalAdeuda)}</div>
                        <div className="text-xs text-gray-400">pendiente</div>
                      </>
                    ) : (
                      <div className="text-sm font-semibold text-emerald-600">Al día</div>
                    )}
                  </div>
                  {expandiendo ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>

                {expandiendo && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">Fiados de {c.nombre}</h4>
                        <button onClick={() => handleEliminarCliente(c.id)}
                          className="text-xs text-red-400 hover:text-red-600 font-medium transition">
                          Eliminar cliente
                        </button>
                      </div>

                      {fiadosCliente.length === 0 ? (
                        <p className="text-sm text-gray-400 py-3">Sin fiados registrados. Crea uno desde la sección de Ventas.</p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {fiadosCliente.map(f => {
                            const adeuda = (Number(f.montoTotal) || 0) - (Number(f.montoPagado) || 0);
                            const esVencido = f.estado === 'pendiente' && f.fechaLimitePago && f.fechaLimitePago < hoy;
                            const esPagado = f.estado === 'pagado';
                            const fiadoExpanded = expandedFiado === f.id;
                            const pagando = mostrarPago === f.id;

                            return (
                              <li key={f.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                <button onClick={() => setExpandedFiado(fiadoExpanded ? null : f.id)}
                                  className="w-full flex items-center gap-2 p-3 text-left hover:bg-slate-50 transition">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {esPagado ? (
                                        <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Pagado</span>
                                      ) : esVencido ? (
                                        <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Vencido</span>
                                      ) : (
                                        <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatearFechaLarga(f.fechaEntrega)}</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                      {(f.productos || []).length} producto{(f.productos || []).length !== 1 ? 's' : ''}
                                      {f.fechaLimitePago && ` · Vence ${formatearFechaLarga(f.fechaLimitePago)}`}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className={`font-bold text-sm ${esPagado ? 'text-emerald-600' : 'text-slate-900'}`}>
                                      {esPagado ? formatearMoneda(f.montoTotal) : formatearMoneda(adeuda)}
                                    </div>
                                    {!esPagado && <div className="text-[10px] text-gray-400">de {formatearMoneda(f.montoTotal)}</div>}
                                  </div>
                                  {fiadoExpanded ? <ChevronUp className="w-3 h-3 text-gray-400 shrink-0" /> : <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />}
                                </button>

                                {fiadoExpanded && (
                                  <div className="px-3 pb-3 border-t border-gray-50">
                                    <ul className="flex flex-col gap-1 py-2">
                                      {(f.productos || []).map((p, i) => (
                                        <li key={i} className="flex justify-between text-xs">
                                          <span className="text-slate-600">{p.nombre} × {p.cantidad}</span>
                                          <span className="text-gray-500">{formatearMoneda((Number(p.precioUnitario) || 0) * (Number(p.cantidad) || 0))}</span>
                                        </li>
                                      ))}
                                    </ul>

                                    {(f.pagos || []).length > 0 && (
                                      <div className="border-t border-gray-50 pt-2 mt-1">
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Pagos</h5>
                                        {f.pagos.map((pago, i) => (
                                          <div key={i} className="flex justify-between text-xs">
                                            <span className="text-emerald-600">Abono</span>
                                            <span className="font-medium text-emerald-600">+{formatearMoneda(pago.monto)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {!esPagado && (
                                      <div className="mt-2">
                                        {pagando ? (
                                          <div className="flex gap-2 items-center">
                                            <input type="text" inputMode="decimal" value={valorPago}
                                              onChange={e => setValorPago(e.target.value)}
                                              onKeyDown={e => e.key === 'Enter' && handlePago(f.id)}
                                              placeholder="Monto abono" autoFocus
                                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
                                            <button onClick={() => handlePago(f.id)}
                                              className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-lg px-4 py-2 font-semibold text-sm hover:brightness-110 transition">
                                              OK
                                            </button>
                                            <button onClick={() => { setMostrarPago(null); setValorPago(''); }}
                                              className="bg-slate-100 text-slate-600 rounded-lg px-3 py-2 font-semibold text-sm hover:bg-slate-200 transition">
                                              X
                                            </button>
                                          </div>
                                        ) : (
                                          <button onClick={() => setMostrarPago(f.id)}
                                            className="w-full bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl py-2 font-bold text-xs hover:brightness-105 active:scale-95 transition">
                                            Registrar pago
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
