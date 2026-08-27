import React, { useEffect, useRef, useState } from 'react';
import {
  Menu, ShoppingCart, Download, Settings, Bell, LogOut,
  AlertTriangle, Package, ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { id: 'dashboard', label: 'INICIO' },
  { id: 'catalogo', label: 'CATÁLOGO' },
  { id: 'venta', label: 'VENTAS' },
  { id: 'compra', label: 'COMPRAS' },
  { id: 'bancos', label: 'BANCOS' },
  { id: 'fiados', label: 'FIADOS' },
  { id: 'historial', label: 'HISTORIAL' },
];

function LogoStrata({ className = 'w-9 h-8' }) {
  return (
    <svg viewBox="0 0 44 32" className={className} fill="none" aria-hidden="true">
      <path d="M3 21 C 10 9, 17 27, 25 15 S 37 9, 40 15" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
      <path d="M3 29 C 10 17, 17 33, 25 21 S 37.5 16, 41 21" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export default function Header({
  onOpenCart, cartCount = 0, puedeInstalar = false,
  onInstalar, esEscritorio = false, view, onNavigate,
}) {
  const { perfilActivo, fiadosVencidos, products, logout } = useApp();
  const [abierto, setAbierto] = useState(null); // 'campana' | 'perfil'
  const [menuAbierto, setMenuAbierto] = useState(false);
  const areaRef = useRef(null);
  const menuRef = useRef(null);

  const stockBajo = products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 5);
  const alertas = [];
  if (perfilActivo && fiadosVencidos.length > 0) {
    alertas.push({ texto: `${fiadosVencidos.length} fiado${fiadosVencidos.length > 1 ? 's' : ''} vencido(s)`, icono: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' });
  }
  if (stockBajo.length > 0) {
    alertas.push({ texto: `Stock bajo: ${stockBajo.slice(0, 2).map(p => p.name).join(', ')}${stockBajo.length > 2 ? '…' : ''}`, icono: Package, color: 'text-amber-500', bg: 'bg-amber-50' });
  }

  useEffect(() => {
    const handler = (e) => {
      if (areaRef.current && !areaRef.current.contains(e.target)) setAbierto(null);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const iniciales = (perfilActivo?.nombre || 'U').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const ir = (v) => {
    setAbierto(null);
    onNavigate?.(v);
  };

  const irAlerta = (tipo) => {
    setAbierto(null);
    onNavigate?.(tipo === 'stock' ? 'catalogo' : 'fiados');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-white/60 shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 h-16 max-w-[1400px] mx-auto">
        {/* Izquierda: logo + marca */}
        <div className="flex items-center gap-2 min-w-0">
          {!esEscritorio && (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuAbierto(o => !o)} aria-label="Menú"
                className="neu-btn p-2 rounded-xl text-slate-600 shrink-0">
                <Menu className="w-5 h-5" />
              </button>
              {menuAbierto && (
                <div className="absolute left-0 top-full mt-2 w-64 neu rounded-2xl p-2 z-50">
                  <nav className="flex flex-col gap-1">
                    {navItems.map(nav => (
                      <button key={nav.id} onClick={() => ir(nav.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[13px] font-bold tracking-wide transition-all ${
                          view === nav.id
                            ? 'bg-blue-50 text-blue-700 shadow-[inset_0_2px_6px_rgba(37,99,235,0.08)]'
                            : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
                        }`}>
                        {nav.label}
                      </button>
                    ))}
                  </nav>
                  <div className="border-t border-slate-100 my-2" />
                  <button onClick={() => ir('respaldo')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition">
                    <Settings className="w-4 h-4" /> Configuración y respaldo
                  </button>
                  <button onClick={() => { setMenuAbierto(false); logout?.(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition">
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
          <button onClick={() => ir('dashboard')} className="flex items-center gap-2 shrink-0 group">
            <LogoStrata />
            <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Strata<span className="text-blue-600">Stock</span>
            </span>
          </button>
        </div>

        {/* Centro: navegación (desktop) */}
        {esEscritorio && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(nav => (
              <button key={nav.id} onClick={() => ir(nav.id)}
                className={`px-3 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-all ${
                  view === nav.id
                    ? 'bg-blue-50 text-blue-700 shadow-[inset_0_2px_6px_rgba(37,99,235,0.08)]'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
                }`}>
                {nav.label}
              </button>
            ))}
          </nav>
        )}

        {/* Derecha: acciones */}
        <div className="flex items-center gap-1 sm:gap-1.5" ref={areaRef}>
          {esEscritorio && puedeInstalar && onInstalar && (
            <button onClick={onInstalar} title="Instalar la app"
              className="neu-btn p-2.5 rounded-xl text-slate-600">
              <Download className="w-4.5 h-4.5" />
            </button>
          )}
          {esEscritorio && (
            <button onClick={() => ir('respaldo')} title="Configuración y respaldo"
              className="neu-btn p-2.5 rounded-xl text-slate-600">
              <Settings className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Campana */}
          <div className="relative">
            <button onClick={() => setAbierto(abierto === 'campana' ? null : 'campana')}
              aria-label="Notificaciones"
              className="neu-btn p-2.5 rounded-xl text-slate-600">
              <Bell className="w-4.5 h-4.5" />
              {alertas.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center leading-none">
                  {alertas.length}
                </span>
              )}
            </button>
            {abierto === 'campana' && (
              <div className="absolute right-0 mt-2 w-72 neu rounded-2xl p-2 z-50">
                <p className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Alertas</p>
                {alertas.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-slate-400">Todo en orden, sin alertas.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {alertas.map((a, i) => (
                      <li key={i}>
                        <button onClick={() => irAlerta(a.texto.includes('Stock') ? 'stock' : 'fiado')}
                          className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left ${a.bg} hover:opacity-90 transition`}>
                          <a.icono className={`w-4 h-4 shrink-0 ${a.color}`} />
                          <span className="text-sm font-medium text-slate-700">{a.texto}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Carrito */}
          <button onClick={onOpenCart} aria-label="Abrir carrito"
            className="relative neu-btn p-2.5 rounded-xl text-slate-600">
            <ShoppingCart className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center leading-none">
                {cartCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="relative">
            <button onClick={() => setAbierto(abierto === 'perfil' ? null : 'perfil')}
              aria-label="Perfil"
              className="flex items-center gap-2 neu-btn rounded-full py-1 pl-1 pr-2.5 text-slate-600">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white text-[13px] font-bold flex items-center justify-center shadow-inner">
                {iniciales}
              </span>
              {esEscritorio && <ChevronDown className="w-4 h-4" />}
            </button>
            {abierto === 'perfil' && (
              <div className="absolute right-0 mt-2 w-64 neu rounded-2xl p-2 z-50">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white font-bold flex items-center justify-center">
                    {iniciales}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{perfilActivo?.nombre || 'Mi perfil'}</p>
                    <p className="text-[11px] text-slate-400">Protegido con PIN</p>
                  </div>
                </div>
                <button onClick={() => ir('respaldo')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition">
                  <Settings className="w-4 h-4" /> Configuración y respaldo
                </button>
                <button onClick={() => { setAbierto(null); logout?.(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition">
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}