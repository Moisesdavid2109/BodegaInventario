import React from 'react';
import { X, Menu, Store, LayoutGrid, PackagePlus, ShoppingCart, PackageMinus, History, Wallet, BarChart3, Download, HardDriveDownload } from 'lucide-react';

const secciones = [
  {
    titulo: 'Movimiento',
    items: [
      { id: 'catalogo', label: 'Catálogo', icon: LayoutGrid },
      { id: 'venta', label: 'Venta', icon: ShoppingCart },
      { id: 'compra', label: 'Compra', icon: PackageMinus },
      { id: 'historial', label: 'Historial de pedidos', icon: History },
    ],
  },
  {
    titulo: 'Finanzas',
    items: [
      { id: 'caja', label: 'Gestor de cuentas', icon: Wallet },
      { id: 'reportes', label: 'Reportes y ganancias', icon: BarChart3 },
    ],
  },
  {
    titulo: 'Administración',
    items: [
      { id: 'nuevoProducto', label: 'Nuevo producto', icon: PackagePlus },
      { id: 'respaldo', label: 'Copia de seguridad', icon: Download },
    ],
  },
];

export default function Sidebar({ open, onClose, view, onNavigate, puedeInstalar = false, onInstalar, esEscritorio = false, onToggle }) {
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
          <div className={`flex items-center h-14 border-b border-gray-100 shrink-0 ${expandido ? 'px-2 justify-start' : 'justify-center'}`}>
            <button
              onClick={onToggle}
              aria-label="Alternar menú"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            {expandido && (
              <div className="w-9 h-9 ml-1 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
            <h3 className="font-semibold text-slate-900">Menú</h3>
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <nav className={`flex flex-col gap-1 overflow-y-auto flex-1 ${expandido ? 'p-3' : 'p-2'}`}>
          {secciones.map(({ titulo, items }) => (
            <div key={titulo} className="flex flex-col gap-1">
              {expandido && titulo && (
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {titulo}
                </p>
              )}
              {items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  title={expandido ? undefined : label}
                  className={`${expandido ? 'flex items-center gap-3 px-4' : 'flex items-center justify-center'} py-3 rounded-xl font-medium transition-colors ${
                    view === id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {expandido && <span className="truncate">{label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {puedeInstalar && onInstalar && (
          <div className={`border-t border-gray-100 shrink-0 ${expandido ? 'p-3' : 'p-2'}`}>
            <button
              onClick={() => { onInstalar(); onClose(); }}
              title={expandido ? undefined : 'Instalar la app'}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 active:scale-95 transition"
            >
              <HardDriveDownload className="w-4 h-4" />
              {expandido && 'Instalar la app'}
            </button>
            {expandido && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Instálala en tu pantalla de inicio para usarla sin internet.
              </p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
