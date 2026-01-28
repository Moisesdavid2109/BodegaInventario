import React, { useEffect, useState } from 'react';
import * as db from '../lib/db';

// Formatea un número como moneda colombiana
function formatearMoneda(n) {
  const formato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  if (!n && n !== 0) return formato.format(0);
  return formato.format(Number(n));
}

// historialDiferencias = [{fecha: 'YYYY-MM-DD', diferencia: number}]
export default function Accounts({ people = [], products = [], onChange, saldo, setSaldo, resumenDiario, setResumenDiario, uid, historialDiferencias = [] }) {
  const [nombrePersona, setNombrePersona] = useState('');
  const [modoInline, setModoInline] = useState(null); // 'add' | 'sub' | null
  const [valorInline, setValorInline] = useState('');
  const [firebaseDisponible, setFirebaseDisponible] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);

  // Devuelve el saldo total actual
  const obtenerTotal = () => saldo;

  // No hace nada, el saldo viene de Firestore
  const refrescarSaldo = async () => {};

  // Abre el input para añadir o restar dinero
  const abrirInline = (modo) => {
    setModoInline(modo);
    setValorInline('');
  };

  // Añade o resta dinero al saldo y actualiza el resumen diario
  const confirmarInline = async () => {
    if (!valorInline) return;
    const valor = parseFloat(valorInline.replace(',', '.'));
    if (Number.isNaN(valor)) return alert('Monto inválido');
    let nuevoSaldo = saldo;
    let nuevoResumen = { ...resumenDiario };
    if (modoInline === 'add') {
      nuevoSaldo = saldo + valor;
      nuevoResumen.ingresos = (resumenDiario?.ingresos || 0) + valor;
    } else if (modoInline === 'sub') {
      nuevoSaldo = saldo - valor;
      nuevoResumen.gastos = (resumenDiario?.gastos || 0) + valor;
    }
    // Calcula la diferencia entre ingresos y gastos
    const ingresos = nuevoResumen.ingresos || 0;
    const gastos = nuevoResumen.gastos || 0;
    nuevoResumen.diferencia = ingresos - gastos;
    setSaldo(nuevoSaldo);
    setResumenDiario(nuevoResumen);
    // Guarda el nuevo estado en Firestore
    const estado = {
      saldo: nuevoSaldo,
      resumenDiario: nuevoResumen,
      clientes: people,
      uid
    };
    const { guardarEstadoGestor } = await import('../gestorFirestore');
    await guardarEstadoGestor(estado);
    setModoInline(null);
    setValorInline('');
    onChange && await onChange();
  };

  // Cancela el input inline
  const cancelarInline = () => {
    setModoInline(null);
    setValorInline('');
  };

  // Elimina todas las personas
  const eliminarTodasPersonas = async () => {
    if (!confirm('¿Borrar todas las personas? Esta acción no se puede deshacer.')) return;
    await db.clearPeople();
    onChange && await onChange();
  };

  // Añade una persona
  const agregarPersona = async () => {
    if (!nombrePersona) return;
    try {
      await db.addPerson({ name: nombrePersona }, uid);
      setNombrePersona('');
      onChange && await onChange();
    } catch (e) {
      alert('Error al agregar persona: ' + (e.message || e));
    }
  };

  // Añade deuda rápida
  const agregarRapido = async (idPersona) => {
    const raw = prompt('Ingrese monto a agregar (número):', '0');
    if (!raw) return;
    const valor = parseFloat(raw.replace(',', '.'));
    if (Number.isNaN(valor)) return alert('Monto inválido');
    try {
      await db.addDebt(idPersona, { productId: null, amount: valor, date: new Date().toISOString() }, uid);
      onChange && await onChange();
    } catch (e) {
      alert('Error al agregar deuda: ' + (e.message || e));
    }
  };

  // Resta deuda rápida
  const restarRapido = async (idPersona) => {
    const raw = prompt('Ingrese monto a descontar (número):', '0');
    if (!raw) return;
    const valor = parseFloat(raw.replace(',', '.'));
    if (Number.isNaN(valor)) return alert('Monto inválido');
    try {
      await db.addDebt(idPersona, { productId: null, amount: -Math.abs(valor), date: new Date().toISOString() }, uid);
      onChange && await onChange();
    } catch (e) {
      alert('Error al descontar deuda: ' + (e.message || e));
    }
  };

  // Calcula el total de deuda de una persona
  const totalPorPersona = (p) => {
    return (p.debts || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);
  };

  // Inline para cada persona
  const [inlinePersona, setInlinePersona] = useState({ personId: null, mode: null });
  const [valorInlinePersona, setValorInlinePersona] = useState('');

  // Abre el input inline para una persona
  const abrirInlinePersona = (idPersona, modo) => {
    setInlinePersona({ personId: idPersona, mode: modo });
    setValorInlinePersona('');
  };

  // Confirma el input inline para una persona
  const confirmarInlinePersona = async (idPersona) => {
    if (!valorInlinePersona) return;
    const valor = parseFloat(valorInlinePersona.replace(',', '.'));
    if (Number.isNaN(valor)) return alert('Monto inválido');
    const monto = inlinePersona.mode === 'add' ? Math.abs(valor) : -Math.abs(valor);
    try {
      await db.addDebt(idPersona, { productId: null, amount: monto, date: new Date().toISOString() }, uid);
      setInlinePersona({ personId: null, mode: null });
      setValorInlinePersona('');
      onChange && await onChange();
    } catch (e) {
      alert('Error al modificar deuda: ' + (e.message || e));
    }
  };

  // Estado de transacciones de caja (no usado)
  const [transaccionesCaja, setTransaccionesCaja] = useState([]);
  const [resumenHoy, setResumenHoy] = useState({ ingresos: 0, gastos: 0, diferencia: 0 });
  const refrescarTransacciones = async () => {
    setTransaccionesCaja([]);
    setResumenHoy({ ingresos: 0, gastos: 0, diferencia: 0 });
  };

  // Inicializa el componente
  useEffect(() => {
    let montado = true;
    (async () => {
      try {
        setFirebaseDisponible(false);
        await refrescarSaldo();
        await refrescarTransacciones();
      } catch (err) {
        setErrorCarga(err && err.message ? err.message : String(err));
        if (montado) {
          setTransaccionesCaja([]);
          setResumenHoy({ ingresos: 0, gastos: 0, diferencia: 0 });
        }
      }
    })();
    return () => { montado = false; };
  }, []);

  // Cancela el input inline de persona
  const cancelarInlinePersona = () => {
    setInlinePersona({ personId: null, mode: null });
    setValorInlinePersona('');
  };


  return (
    <section>
      <div className="balance-panel panel">
        <div className="balance-amount">{formatearMoneda(obtenerTotal())}</div>
        <div className="big-actions">
          <button className="btn-add" onClick={() => abrirInline('add')}>+ Añadir</button>
          <button className="btn-sub" onClick={() => abrirInline('sub')}>- Restar</button>
        </div>
        {modoInline && (
          <div className="inline-input">
            <input inputMode="numeric" placeholder="0" value={valorInline} onChange={e => setValorInline(e.target.value)} />
            <div className="inline-actions">
              <button className="confirm" onClick={confirmarInline}>OK</button>
              <button className="cancel" onClick={cancelarInline}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Estado de Firestore */}
      {!firebaseDisponible && !errorCarga && (
        <div style={{ padding: '8px 12px', fontSize: 13, color: '#666' }}>Modo local (sin sincronización en la nube)</div>
      )}

      {/* Error de carga */}
      {errorCarga && (
        <div style={{ padding: '8px 12px', fontSize: 13, color: 'crimson' }}>
          {errorCarga.includes('No Firestore disponible') || errorCarga.includes('Permission') ? 'Modo local: no se pudo conectar al servicio en la nube.' : ('Error al cargar datos: ' + errorCarga)}
        </div>
      )}

      <div className="daily-summary panel">
        <h3>Resumen Diario</h3>
        <div className="summary-rows">
          <div className="summary-row"><span>Ingresos Hoy</span><span className="income">{formatearMoneda(resumenDiario?.ingresos ?? 0)}</span></div>
          <div className="summary-row"><span>Gastos Hoy</span><span className="expense">{formatearMoneda(resumenDiario?.gastos ?? 0)}</span></div>
        </div>
        <div className="chart" aria-hidden>
          <svg viewBox="0 0 120 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img">
            <defs>
              <linearGradient id="mountainGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#5fb7ff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#1f6fbf" stopOpacity="0.12" />
              </linearGradient>
              <linearGradient id="mountainStroke" x1="0" x2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            {/* Gráfica de evolución diaria */}
            {(() => {
              const maxDiff = 48;
              let historial = historialDiferencias && historialDiferencias.length ? historialDiferencias.slice(-6) : [];
              const hoy = new Date().toISOString().slice(0, 10);
              if (!historial.find(d => d.fecha === hoy)) {
                historial = [...historial, { fecha: hoy, diferencia: resumenDiario?.diferencia ?? 0 }];
              }
              while (historial.length < 6) historial.unshift({ fecha: '', diferencia: 0 });
              const puntos = historial.map((d, i) => {
                let diff = typeof d.diferencia === 'number' && !isNaN(d.diferencia) ? d.diferencia : 0;
                diff = Math.max(-maxDiff, Math.min(maxDiff, diff));
                const x = 8 + i * 24;
                const y = 28 - (diff / maxDiff) * 20;
                return `${x},${y}`;
              }).join(' ');
              const idxActual = 5;
              const puntoActual = puntos.split(' ')[idxActual];
              const [cx, cy] = puntoActual ? puntoActual.split(',').map(Number) : [120, 28];
              return <>
                <polyline points={puntos} fill="none" stroke="url(#mountainStroke)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={cx} cy={cy} r="3.6" fill="#08469a" stroke="#fff" strokeWidth="1" />
              </>;
            })()}
          </svg>
          <div className="chart-net">{resumenDiario?.diferencia >= 0 ? '+' : ''}{formatearMoneda(resumenDiario?.diferencia ?? 0)} Hoy</div>
        </div>
      </div>

      <h2>Clientes que deben</h2>

      <div className="person-form form small">
        <div className="person-input">
          <span className="icon-user" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#A0B0B8" />
              <path d="M4 20c0-3.314 4.03-6 8-6s8 2.686 8 6v1H4v-1z" fill="#A0B0B8" />
            </svg>
          </span>
          <input className="input-person" placeholder="Nombre de la persona" value={nombrePersona} onChange={e => setNombrePersona(e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-person-add" onClick={agregarPersona}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" fill="#fff" /></svg>
            <span>Añadir persona</span>
          </button>
        </div>
      </div>

      <div className="people">
        {people.map(p => (
          <div key={p.id} className="person">
            <div className="avatar">
              <img src="https://media.istockphoto.com/id/2151669184/es/vector/ilustraci%C3%B3n-plana-vectorial-en-escala-de-grises-avatar-perfil-de-usuario-icono-de-persona.jpg?s=612x612&w=0&k=20&c=H3j0PHImJLL8wzUGOwsmgNORb7i27eNQr1uQUyTefCA=" alt={p.name} />
            </div>
            <div className="info">
              <h3>{p.name}</h3>
            </div>
            <div className="actions">
              <div className="amount">{formatearMoneda(totalPorPersona(p))}</div>
              <div className="quick">
                {!(inlinePersona.personId === p.id) ? (
                  <>
                    <button className="add" title="Agregar deuda" onClick={() => abrirInlinePersona(p.id, 'add')}>+</button>
                    <button className="sub" title="Registrar pago" onClick={() => abrirInlinePersona(p.id, 'sub')}>-</button>
                  </>
                ) : (
                  <div className="person-inline">
                    <input inputMode="numeric" placeholder="0" value={valorInlinePersona} onChange={e => setValorInlinePersona(e.target.value)} />
                    <div className="person-inline-actions">
                      <button className="confirm" onClick={() => confirmarInlinePersona(p.id)}>OK</button>
                      <button className="cancel" onClick={cancelarInlinePersona}>X</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
