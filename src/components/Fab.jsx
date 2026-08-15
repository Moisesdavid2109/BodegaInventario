import React from 'react';
import { ShoppingCart } from 'lucide-react';

export default function Fab({ onClick, count = 0 }) {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir carrito"
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 active:scale-95 transition z-40"
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
