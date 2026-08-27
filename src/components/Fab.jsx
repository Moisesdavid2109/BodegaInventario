import React from 'react';
import { ShoppingCart } from 'lucide-react';

export default function Fab({ onClick, count = 0 }) {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir carrito"
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] bg-gradient-to-br from-sky-500 to-blue-600 text-white p-3 rounded-full shadow-[0_10px_24px_rgba(37,99,235,0.45)] hover:brightness-105 active:scale-95 transition z-40"
    >
      <ShoppingCart className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}
