import React, { useRef, useState } from 'react';
import { ArrowLeft, Download, Upload, HardDrive, AlertTriangle } from 'lucide-react';

export default function Respaldo({ onExportar, onImportar, onVolver }) {
  const fileRef = useRef(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

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

  return (
    <section className="max-w-2xl mx-auto px-4 py-5">
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
    </section>
  );
}
