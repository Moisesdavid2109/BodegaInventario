import React from 'react';
import {
  X, Menu, LayoutGrid, ShoppingCart, CreditCard, ShoppingBag,
  Users, History, Download, HardDriveDownload, LayoutDashboard
} from 'lucide-react';

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'catalogo', label: 'Catálogo', icon: LayoutGrid },
  { id: 'venta', label: 'Venta', icon: ShoppingCart },
  { id: 'compra', label: 'Compra', icon: ShoppingBag },
  { id: 'bancos', label: 'Bancos y Tarjetas', icon: CreditCard },
  { id: 'fiados', label: 'Fiados', icon: Users },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'respaldo', label: 'Copia de seguridad', icon: Download },
];

export default function Sidebar({ open, onClose, view, onNavigate, puedeInstalar = false, onInstalar, esEscritorio = false, onToggle, perfilActivo, onLogout }) {
  const expandido = open;
  return (
    <>
      {!esEscritorio && (
        <div
          className={`fixed inset-0 bg-black/25 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${
          esEscritorio
            ? `sticky top-0 h-screen shrink-0 flex flex-col overflow-hidden bg-white border-r transition-[width] duration-300 ease-in-out ${expandido ? 'w-72 border-gray-100' : 'w-16 border-gray-100'}`
            : `fixed top-0 left-0 h-full w-72 max-w-[85%] bg-white shadow-xl z-50 transform transition-transform duration-300 flex-col ${open ? 'flex translate-x-0' : 'flex -translate-x-full'}`
        }`}
        role="dialog"
        aria-label="Menú"
        aria-hidden={esEscritorio ? false : !open}
      >
        {esEscritorio ? (
          <div className={`flex items-center h-14 border-b border-gray-100 shrink-0 ${expandido ? 'px-3 justify-start gap-2' : 'justify-center'}`}>
            <button onClick={onToggle} aria-label="Alternar menú" className="p-2 rounded-xl hover:bg-slate-100 text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
            {expandido && (
              <span className="text-base font-bold text-slate-900 truncate">{perfilActivo?.nombre || 'Bodega'}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
            <span className="font-bold text-base text-slate-900">{perfilActivo?.nombre || 'Bodega'}</span>
            <button onClick={onClose} aria-label="Cerrar menú" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <nav className={`flex flex-col gap-1 overflow-y-auto flex-1 ${expandido ? 'p-3' : 'p-2'}`}>
          {items.map(({ id, label, icon: Icon }, idx) => (
            <React.Fragment key={id}>
              {expandido && idx === items.length - 3 && (
                <div className="border-t border-gray-100 my-2" />
              )}
              <button
                onClick={() => onNavigate(id)}
                title={expandido ? undefined : label}
                className={`${expandido ? 'flex items-center gap-3 px-4' : 'flex items-center justify-center'} py-3 rounded-xl font-medium transition-colors ${
                  view === id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {expandido && <span className="truncate text-sm">{label}</span>}
              </button>
            </React.Fragment>
          ))}
        </nav>

        {perfilActivo && (
          <div className={`border-t border-gray-100 shrink-0 ${expandido ? 'p-3' : 'p-2'} flex flex-col gap-2`}>
            {puedeInstalar && onInstalar && (
              <button
                onClick={() => { onInstalar(); onClose(); }}
                title={expandido ? undefined : 'Instalar la app'}
                className={`${expandido ? 'flex items-center justify-center gap-2' : 'flex items-center justify-center'} bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 active:scale-95 transition`}
              >
                <HardDriveDownload className="w-4 h-4" />
                {expandido && 'Instalar la app'}
              </button>
            )}
            <button
              onClick={() => { onLogout(); onClose(); }}
              className={`${expandido ? 'flex items-center justify-center gap-2' : 'flex items-center justify-center'} text-red-500 hover:bg-red-50 rounded-xl px-4 py-2.5 text-sm font-semibold transition`}
            >
              {expandido ? 'Cerrar sesión' : <X className="w-4 h-4" />}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
