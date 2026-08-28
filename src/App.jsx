import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';

import Fab from './components/Fab';
import SelectorPerfil from './components/auth/SelectorPerfil';
import Dashboard from './components/dashboard/Dashboard';
import CajaHistorial from './components/dashboard/CajaHistorial';
import Catalogo from './components/Catalogo';
import NuevoProducto from './components/NuevoProducto';
import Pedido from './components/Pedido';
import Historial from './components/Historial';
import BancoTarjetas from './components/bancos/BancoTarjetas';
import RegistroFiados from './components/fiados/RegistroFiados';
import Respaldo from './components/Respaldo';

function consultaEscritorio() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(min-width: 768px)').matches;
}

function AppContent() {
  const {
    perfilActivo, cargando, login,
    products, agregarProducto, actualizarProducto, actualizarPrecio, actualizarStock, eliminarProducto,
    clientes, agregarFiado, pedidos, agregarPedido,
    exportarRespaldo, importarRespaldo,
  } = useApp();

  const [view, setView] = useState('dashboard');
  const [esEscritorio, setEsEscritorio] = useState(consultaEscritorio);
  const [pedidoItems, setPedidoItems] = useState([]);
  const [editando, setEditando] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [appInstalada, setAppInstalada] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const onCambio = (e) => setEsEscritorio(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onCambio);
    else if (mq.addListener) mq.addListener(onCambio);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onCambio);
      else if (mq.removeListener) mq.removeListener(onCambio);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const instalada = () => { setInstallPrompt(null); setAppInstalada(true); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', instalada);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', instalada);
    };
  }, []);

  useEffect(() => {
    if (perfilActivo) setView('dashboard');
  }, [perfilActivo?.id]);

  const puedeInstalar = !!installPrompt && !appInstalada;

  const instalarApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch {}
    setInstallPrompt(null);
  };

  const navegar = (v) => {
    if (v === 'nuevoProducto') setEditando(null);
    if (v === 'venta' || v === 'compra') setPedidoItems([]);
    setView(v);
  };

  const abrirVentaCon = (product) => {
    setPedidoItems(prev => {
      const ex = prev.find(i => i.key === product.id);
      if (ex) return prev.map(i => i.key === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { key: product.id, product, precio: Number(product.price) || 0, qty: 1 }];
    });
    setView('venta');
  };

  const ajustarStock = (items, direccion) => {
    items.forEach(it => {
      const prod = products.find(p => p.id === (it.key || it.product?.id));
      if (!prod) return;
      const actual = Number(prod.stock) || 0;
      const nuevo = direccion === 'restar' ? Math.max(0, actual - it.qty) : actual + it.qty;
      actualizarStock(prod.id, nuevo);
    });
  };

  const confirmarVenta = async ({ items, total, fiadoPersonaId }) => {
    try {
      const pedido = {
        tipo: 'venta', fecha: new Date().toISOString(), items, total,
        fiadoPersonaId: fiadoPersonaId || null,
      };
      await agregarPedido(pedido);
      ajustarStock(items, 'restar');

      if (fiadoPersonaId) {
        const cliente = clientes.find(c => c.id === fiadoPersonaId);
        const hoy = new Date().toISOString().slice(0, 10);
        const limite = new Date();
        limite.setDate(limite.getDate() + 7);
        await agregarFiado({
          clienteId: fiadoPersonaId,
          clienteNombre: cliente?.nombre || 'Desconocido',
          productos: items.map(i => ({
            nombre: i.product?.name || '',
            cantidad: i.qty,
            precioUnitario: i.precio,
          })),
          montoTotal: total,
          montoPagado: 0,
          fechaEntrega: hoy,
          fechaLimitePago: limite.toISOString().slice(0, 10),
          estado: 'pendiente',
          pagos: [],
        });
      }

      setPedidoItems([]);
      setView('historial');
    } catch (err) {
      console.error('Error confirmando venta:', err);
      alert('Error al guardar la venta: ' + (err.message || 'Error desconocido'));
    }
  };

  const confirmarCompra = async ({ items, total, proveedor }) => {
    try {
      const pedido = {
        tipo: 'compra', fecha: new Date().toISOString(), items, total,
        proveedor: proveedor || null,
      };
      await agregarPedido(pedido);
      ajustarStock(items, 'sumar');
      setPedidoItems([]);
      setView('historial');
    } catch (err) {
      console.error('Error confirmando compra:', err);
      alert('Error al guardar la compra: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleSelectPerfil = async (perfil) => {
    await login(perfil, perfil.pin);
  };

  if (!perfilActivo) {
    return <SelectorPerfil onSelect={handleSelectPerfil} />;
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const pedidoCount = pedidoItems.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen pb-[max(7rem,env(safe-area-inset-bottom))] flex flex-col">
      <Header
        onOpenCart={() => setView('venta')}
        cartCount={pedidoCount}
        puedeInstalar={puedeInstalar}
        onInstalar={instalarApp}
        esEscritorio={esEscritorio}
        view={view}
        onNavigate={navegar}
      />

      <main>
        {view === 'dashboard' && <Dashboard onNavigate={navegar} />}

        {view === 'caja' && <CajaHistorial onVolver={() => setView('dashboard')} />}

          {view === 'catalogo' && (
            <Catalogo
              products={products}
              onAddToCart={abrirVentaCon}
              onNuevoProducto={() => { setEditando(null); setView('nuevoProducto'); }}
              onEditar={(p) => { setEditando(p); setView('nuevoProducto'); }}
              onEliminar={(p) => { if (confirm(`¿Eliminar "${p.name}"?`)) eliminarProducto(p.id); }}
            />
          )}

          {view === 'nuevoProducto' && (
            <NuevoProducto
              editando={editando}
              onGuardar={async (prod) => {
                try {
                  const { price, costPrice, stock, ...producto } = { ...prod, id: prod.id || undefined };
                  if (prod.id) {
                    await actualizarProducto(prod.id, producto);
                    await actualizarPrecio(prod.id, price, costPrice);
                    await actualizarStock(prod.id, stock ?? 0);
                  } else {
                    await agregarProducto(producto, price, costPrice, stock ?? 0);
                  }
                  setEditando(null);
                  setView('catalogo');
                } catch (err) {
                  console.error('Error en onGuardar:', err);
                  alert('Error al guardar producto: ' + (err.message || 'Revisa la consola'));
                }
              }}
              onCancelar={() => setView('catalogo')}
            />
          )}

          {view === 'venta' && (
            <Pedido
              products={products}
              clientes={clientes}
              tipo="venta"
              items={pedidoItems}
              setItems={setPedidoItems}
              onConfirmarVenta={confirmarVenta}
              onConfirmarCompra={confirmarCompra}
              onVolver={() => setView('catalogo')}
            />
          )}

          {view === 'compra' && (
            <Pedido
              products={products}
              clientes={clientes}
              tipo="compra"
              items={pedidoItems}
              setItems={setPedidoItems}
              onConfirmarVenta={confirmarVenta}
              onConfirmarCompra={confirmarCompra}
              onVolver={() => setView('catalogo')}
            />
          )}

          {view === 'bancos' && <BancoTarjetas onVolver={() => setView('dashboard')} />}
          {view === 'fiados' && <RegistroFiados onVolver={() => setView('dashboard')} />}

          {view === 'historial' && (
            <Historial pedidos={pedidos} clientes={clientes} onVolver={() => setView('dashboard')} />
          )}

          {view === 'respaldo' && (
            <Respaldo onExportar={exportarRespaldo} onImportar={importarRespaldo} onVolver={() => setView('dashboard')} />
          )}
        </main>

      {view !== 'venta' && view !== 'compra' && (
        <Fab onClick={() => setView('venta')} count={pedidoCount} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
