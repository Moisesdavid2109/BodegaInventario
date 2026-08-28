import React, { useState } from 'react';
import { UserPlus, Lock, AlertCircle, ChevronRight } from 'lucide-react';
import PINInput from './PINInput';
import CrearPerfil from './CrearPerfil';
import * as fs from '../../lib/firestore';

const FONDO = 'min-h-screen relative overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4';

function Decorado() {
  return (
    <>
      <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-sky-200/70 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-36 -right-28 w-[28rem] h-[28rem] rounded-full bg-indigo-200/70 blur-3xl" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-blue-100/70 blur-3xl" aria-hidden="true" />
    </>
  );
}

function LogoStrata({ className = 'w-12 h-10', light = true }) {
  return (
    <svg viewBox="0 0 44 32" className={className} fill="none" aria-hidden="true">
      <path d="M3 21 C 10 9, 17 27, 25 15 S 37 9, 40 15" stroke={light ? '#ffffff' : '#38bdf8'} strokeWidth="5" strokeLinecap="round" />
      <path d="M3 29 C 10 17, 17 33, 25 21 S 37.5 16, 41 21" stroke={light ? '#ffffff' : '#2563eb'} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Tarjeta({ children }) {
  return (
    <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-blue-900/10 ring-1 ring-white/70 p-8 animate-[fadeIn_.3s_ease]">
      {children}
    </div>
  );
}

function Encabezado() {
  return (
    <div className="text-center mb-8">
      <div className="w-20 h-20 mx-auto rounded-[1.6rem] bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 ring-4 ring-white/60 flex items-center justify-center">
        <LogoStrata className="w-12 h-10" light />
      </div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
        Strata<span className="text-blue-600">Stock</span>
      </h1>
      <p className="text-sm text-slate-500 mt-1">Tu negocio, al día.</p>
    </div>
  );
}

export default function SelectorPerfil({ onSelect }) {
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    fs.obtenerPerfiles()
      .then(p => { setPerfiles(p); setCargando(false); })
      .catch(e => { console.error('Error cargando perfiles:', e); setCargando(false); });
  }, []);

  const handlePIN = async (pin) => {
    setError('');
    try {
      if (perfilSeleccionado.pin === pin) {
        onSelect(perfilSeleccionado);
      } else {
        setError('PIN incorrecto');
      }
    } catch (e) {
      setError('Error al verificar PIN');
    }
  };

  const handleCrear = async (nombre, pin) => {
    await fs.crearPerfil(nombre, pin);
    const nuevos = await fs.obtenerPerfiles();
    setPerfiles(nuevos);
    setMostrarCrear(false);
  };

  const iniciales = (nombre) => (
    (nombre || 'U').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  );

  if (mostrarCrear) {
    return (
      <div className={FONDO}>
        <Decorado />
        <CrearPerfil onCrear={handleCrear} onCancelar={() => setMostrarCrear(false)} />
      </div>
    );
  }

  if (perfilSeleccionado) {
    return (
      <div className={FONDO}>
        <Decorado />
        <Tarjeta>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 text-lg font-extrabold">
            {iniciales(perfilSeleccionado.nombre)}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{perfilSeleccionado.nombre}</h2>
          <p className="text-sm text-gray-400 mb-6">Ingresa tu PIN de 4 dígitos</p>
          <PINInput key={`pin-login-${perfilSeleccionado.id}`} resetKey={`pin-login-${perfilSeleccionado.id}`} onSubmit={handlePIN} />
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 mt-3 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <button onClick={() => { setPerfilSeleccionado(null); setError(''); }}
            className="mt-5 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition">
            <ChevronRight className="w-4 h-4 rotate-180" /> Volver
          </button>
        </Tarjeta>
      </div>
    );
  }

  return (
    <div className={FONDO}>
      <Decorado />
      <Tarjeta>
        <Encabezado />

        {cargando ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Cargando perfiles...</p>
          </div>
        ) : (
          <>
            {perfiles.length === 0 && (
              <div className="text-center py-6 mb-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">No hay perfiles creados</p>
                <p className="text-slate-300 text-xs mt-1">Crea uno para comenzar</p>
              </div>
            )}

            <div className="flex flex-col gap-2.5 mb-5">
              {perfiles.map(p => (
                <button key={p.id} onClick={() => { setPerfilSeleccionado(p); setError(''); }}
                  className="group flex items-center gap-3 w-full p-3.5 rounded-2xl bg-slate-50/80 ring-1 ring-slate-200/70 hover:bg-white hover:ring-sky-300 hover:shadow-lg hover:shadow-sky-100 transition text-left active:scale-[0.98]">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white text-sm font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-blue-200/70">
                    {iniciales(p.nombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{p.nombre}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Protegido con PIN
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>

            <button onClick={() => setMostrarCrear(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-sky-400 hover:text-blue-600 hover:bg-sky-50/60 transition font-medium text-sm active:scale-[0.98]">
              <UserPlus className="w-4 h-4" />
              Crear nuevo perfil
            </button>
          </>
        )}
      </Tarjeta>
    </div>
  );
}