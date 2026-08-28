import React, { useState } from 'react';
import { Store, UserPlus, Lock, User, AlertCircle } from 'lucide-react';
import PINInput from './PINInput';
import CrearPerfil from './CrearPerfil';
import * as fs from '../../lib/firestore';

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

  if (mostrarCrear) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4">
        <CrearPerfil onCrear={handleCrear} onCancelar={() => setMostrarCrear(false)} />
      </div>
    );
  }

  if (perfilSeleccionado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{perfilSeleccionado.nombre}</h2>
          <p className="text-sm text-gray-400 mb-6">Ingresa tu PIN</p>
          <PINInput key={`pin-login-${perfilSeleccionado.id}`} resetKey={`pin-login-${perfilSeleccionado.id}`} onSubmit={handlePIN} />
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 mt-3 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <button onClick={() => { setPerfilSeleccionado(null); setError(''); }}
            className="mt-4 text-sm text-slate-500 hover:text-slate-700 transition">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">BodegaInventario</h1>
          <p className="text-sm text-gray-400 mt-1">Selecciona un perfil para continuar</p>
        </div>

        {cargando ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Cargando perfiles...</p>
          </div>
        ) : (
          <>
            {perfiles.length === 0 && (
              <div className="text-center py-4 mb-4 bg-slate-50 rounded-2xl">
                <p className="text-gray-400 text-sm">No hay perfiles creados</p>
                <p className="text-gray-300 text-xs mt-1">Crea uno para comenzar</p>
              </div>
            )}

            <div className="flex flex-col gap-3 mb-4">
              {perfiles.map(p => (
                <button key={p.id} onClick={() => { setPerfilSeleccionado(p); setError(''); }}
                  className="flex items-center gap-3 w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition text-left active:scale-95">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{p.nombre}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Protegido con PIN
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={() => setMostrarCrear(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition font-medium text-sm">
              <UserPlus className="w-4 h-4" />
              Crear nuevo perfil
            </button>
          </>
        )}
      </div>
    </div>
  );
}
