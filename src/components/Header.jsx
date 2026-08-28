import React from 'react';
import { Menu, ShoppingCart, Download, Store } from 'lucide-react';

export default function Header({ onOpenMenu, onOpenCart, cartCount = 0, puedeInstalar = false, onInstalar, esEscritorio = false }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-2 px-4 h-14 max-w-3xl mx-auto">
        {esEscritorio ? (
          <div className="w-10 shrink-0" />
        ) : (
          <button
            onClick={onOpenMenu}
            aria-label="Menú"
            className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 text-slate-600"
          >
            <Menu className="w-5 h-5" />
            <span className="text-sm font-medium">Menú</span>
          </button>
        )}

        <div className="flex items-center gap-2 flex-1 justify-center">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">BodegaLista</h1>
        </div>

        <div className="flex items-center gap-0.5">
          {puedeInstalar && onInstalar && (
            <button
              onClick={onInstalar}
              aria-label="Instalar la app"
              title="Instalar la app"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onOpenCart}
            aria-label="Abrir carrito"
            className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
