import React, { useRef, useState } from 'react';
import { ArrowLeft, Download, Upload, HardDrive, AlertTriangle, Trash2 } from 'lucide-react';
import PINInput from './auth/PINInput';
import { useApp } from '../context/AppContext';

export default function Respaldo({ onExportar, onImportar, onVolver }) {
  const { perfilActivo, borrarCuenta } = useApp();
  const fileRef = useRef(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [pinError, setPinError] = useState('');
  const [intentos, setIntentos] = useState(0);

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setMensaje('');
    try {
      await onImportar(file);
      setMensaje('Respaldo importado. La app se recargará.');
    } catch (err) {
      setError('El archivo no es un respaldo válido de StrataStock.');
    }
  };

  const exportar = async () => {
    setError('');
    setMensaje('');
    await onExportar();
    setMensaje('Respaldo exportado correctamente.');
  };

  const confirmarBorrado = async (pin) => {
    if (pin !== perfilActivo?.pin) {
      setPinError('PIN incorrecto. Intenta de nuevo.');
      setIntentos(i => i + 1);
      return;
    }
    setPinError('');
    setBorrando(true);
    try {
      await borrarCuenta();
    } catch (e) {
      console.error('Error borrando cuenta:', e);
      setPinError('Error al borrar la cuenta. Intenta de nuevo.');
      setBorrando(false);
    }
  };

  const abrirConfirmacion = () => {
    setPinError('');
    setConfirmando(true);
  };

  return (
    <section className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-6">
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <HardDrive className="w-5 h-5 text-blue-600" />
        Copia de seguridad
      </h2>

      <div className="neu rounded-2xl p-5 mb-4">
        <p className="text-sm text-slate-600 mb-4">
          Tus datos (caja, productos, fiados, gastos, pedidos) se guardan solo en este dispositivo.
          Exporta un respaldo y guárdalo en un lugar seguro (WhatsApp, correo o USB) para poder
          restaurarlos si cambias de teléfono o borras los datos de la app.
        </p>

        <button
          onClick={exportar}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl px-4 py-3 font-semibold hover:brightness-105 active:scale-95 transition mb-3"
        >
          <Download className="w-5 h-5" />
          Exportar respaldo
        </button>

        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-slate-700 rounded-xl px-4 py-3 font-semibold hover:bg-slate-50 active:scale-95 transition"
        >
          <Upload className="w-5 h-5" />
          Importar respaldo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
      {mensaje && !error && (
        <div className="text-sm text-sky-700 bg-sky-50 rounded-xl px-3 py-2">{mensaje}</div>
      )}

      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 mt-6">
        <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4" />
          Borrar cuenta
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Esta acción elimina permanentemente la cuenta y todos sus datos
          (precios, pedidos, fiados, caja, banco y clientes) de este perfil.
          Esta acción no se puede deshacer.
        </p>
        <button
          onClick={abrirConfirmacion}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white rounded-xl px-4 py-3 font-semibold hover:bg-red-700 active:scale-95 transition"
        >
          <Trash2 className="w-5 h-5" />
          Borrar cuenta
        </button>
      </div>

      {confirmando && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Borrar esta cuenta</h3>
            <p className="text-sm text-gray-400 mb-1">Se eliminará permanentemente todo:</p>
            <p className="text-sm text-gray-400 mb-5">
              precios, pedidos, fiados, caja, banco y clientes.
            </p>
            <p className="text-sm font-medium text-slate-600 mb-4">Ingresa tu PIN para confirmar</p>
            <PINInput
              key={`borrar-${intentos}`}
              resetKey={`borrar-${intentos}`}
              onSubmit={confirmarBorrado}
            />
            {pinError && (
              <div className="flex items-center gap-2 text-sm text-red-500 mt-3 justify-center">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {pinError}
              </div>
            )}
            {borrando && (
              <div className="flex items-center justify-center gap-2 text-sm text-red-600 mt-3">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                Borrando cuenta...
              </div>
            )}
            <button
              onClick={() => setConfirmando(false)}
              disabled={borrando}
              className="mt-5 text-sm text-slate-500 hover:text-slate-700 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
