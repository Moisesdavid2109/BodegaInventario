import React, { useRef, useEffect, useState } from 'react';
import { Delete } from 'lucide-react';

export default function PINInput({ onSubmit, length = 4, resetKey }) {
  const [digits, setDigits] = useState([]);
  const inputRef = useRef(null);
  const submittedRef = useRef(false);
  const callbackRef = useRef(onSubmit);
  callbackRef.current = onSubmit;

  useEffect(() => {
    setDigits([]);
    submittedRef.current = false;
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [resetKey]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const arr = raw.slice(0, length).split('');
    setDigits(arr);
    if (arr.length === length && !submittedRef.current) {
      submittedRef.current = true;
      callbackRef.current(arr.join(''));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = digits.slice(0, -1);
      setDigits(next);
    }
  };

  const borrar = () => {
    setDigits([]);
    submittedRef.current = false;
    inputRef.current.value = '';
    inputRef.current.focus();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[244px] h-14">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={length}
          value={digits.join('')}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Ingresa tu PIN"
        />
        <div className="flex gap-3 pointer-events-none">
          {Array.from({ length }, (_, i) => (
            <div
              key={`${resetKey}-${i}`}
              className="w-14 h-14 flex items-center justify-center border-2 border-gray-200 rounded-xl text-2xl font-bold text-slate-900"
            >
              {digits[i] ? '●' : ''}
            </div>
          ))}
        </div>
      </div>
      <button onClick={borrar} className="p-2 text-gray-400 hover:text-red-500 transition">
        <Delete className="w-5 h-5" />
      </button>
    </div>
  );
}
