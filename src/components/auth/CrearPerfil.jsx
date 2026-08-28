import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import PINInput from './PINInput';

export default function CrearPerfil({ onCrear, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [fase, setFase] = useState('nombre');
  const [creando, setCreando] = useState(false);

  const handleNombre = () => {
    if (!nombre.trim()) return setError('Escribe un nombre');
    setError('');
    setFase('pin');
  };

  const handlePIN = (p) => {
    console.log('PIN recibido:', p);
    setPin(p);
    setError('');
    setFase('confirmar');
  };

  const handleConfirmar = async (p) => {
    if (p !== pin) {
      setError('Los PINs no coinciden. Intenta de nuevo.');
      setPin('');
      setFase('pin');
      return;
    }
    setCreando(true);
    setError('');
    try {
      await onCrear(nombre.trim(), p);
    } catch (e) {
      setError('Error al crear perfil: ' + (e.message || 'Error desconocido'));
      setCreando(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
      <button onClick={onCancelar}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <h2 className="text-xl font-bold text-slate-900 mb-1">Crear perfil</h2>
      <p className="text-sm text-gray-400 mb-6">
        {fase === 'nombre' && '¿Cómo se llama este perfil?'}
        {fase === 'pin' && 'Define un PIN de 4 dígitos'}
        {fase === 'confirmar' && 'Confirma tu PIN'}
      </p>

      {fase === 'nombre' && (
        <div className="flex flex-col gap-3">
          <input value={nombre} onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNombre()}
            placeholder="Ej: Tienda Principal" autoFocus
            className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition" />
          <button onClick={handleNombre}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl px-4 py-3 font-semibold hover:bg-emerald-700 transition">
            <CheckCircle2 className="w-4 h-4" /> Continuar
          </button>
        </div>
      )}

      {fase === 'pin' && <PINInput key="pin-create" resetKey="pin-create" onSubmit={handlePIN} />}
      {fase === 'confirmar' && <PINInput key="confirm-create" resetKey="confirm-create" onSubmit={handleConfirmar} />}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 mt-3 text-center justify-center">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {creando && (
        <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 mt-3">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Creando perfil...
        </div>
      )}
    </div>
  );
}
