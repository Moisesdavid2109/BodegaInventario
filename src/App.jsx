import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import Banner from './components/Banner'
import Sidebar from './components/Sidebar'
import Fab from './components/Fab'
import Catalogo from './components/Catalogo'
import NuevoProducto from './components/NuevoProducto'
import Pedido from './components/Pedido'
import Historial from './components/Historial'
import CajaYFiados from './components/CajaYFiados'
import Reportes from './components/Reportes'
import Respaldo from './components/Respaldo'
import * as db from './lib/db'
import { guardarEstadoGestor, obtenerEstadoGestor } from './gestorLocal'
import defaultData from './data/products.json'

function getTodayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

const RESUMEN_VACIO = () => ({ ingresos: 0, gastos: 0, diferencia: 0, fecha: getTodayString() });

function normalizarCategoria(c) {
  const s = String(c || 'General').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (s.startsWith('dulce')) return 'Dulces';
  if (s.startsWith('viver')) return 'Víveres';
  if (s.startsWith('limp')) return 'Limpieza';
  return 'General';
}

// Asegura que los productos del catálogo de respaldo tengan el mismo formato que los guardados
function normalizarProducto(p) {
  return {
    id: p.id || p.name || p.nombre || Math.random().toString(36).slice(2, 8),
    name: p.name || p.nombre || '',
    category: normalizarCategoria(p.category || p.categoria),
    price: Number(p.price ?? p.precio ?? 0) || 0,
    costPrice: Number(p.costPrice ?? p.precioCompra ?? 0) || 0,
    image: p.image || p.imagen || null,
    stock: Number(p.stock ?? 0) || 0,
  };
}

function productosDeRespaldo() {
  return (defaultData.products || []).map(normalizarProducto);
}

// Normaliza los productos guardados para garantizar que todos tengan id, precio y stock.
function productosDeEstado(estado) {
  if (estado.products && estado.products.length) {
    return estado.products.map(normalizarProducto);
  }
  return productosDeRespaldo();
}

// Normaliza los movimientos guardados (ingresos y gastos) para garantizar formato uniforme.
function movimientosDeEstado(estado) {
  return (estado.gastos || []).map(m => ({
    id: m.id || generarId(),
    tipo: m.tipo === 'ingreso' ? 'ingreso' : 'gasto',
    concepto: m.concepto || (m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'),
    monto: Number(m.monto) || 0,
    fecha: m.fecha || new Date().toISOString(),
    pedidoId: m.pedidoId || null,
  }));
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// True si la pantalla es de escritorio (>= 768px). En PC el menú queda abierto por defecto.
function consultaEscritorio() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(min-width: 768px)').matches;
}

export default function App() {
  const [view, setView] = useState('catalogo')
  const [esEscritorio, setEsEscritorio] = useState(consultaEscritorio)
  const [sidebarOpen, setSidebarOpen] = useState(consultaEscritorio)
  const [products, setProducts] = useState([])
  const [people, setPeople] = useState([])
  const [saldo, setSaldo] = useState(0)
  const [resumenDiario, setResumenDiario] = useState(RESUMEN_VACIO())
  const [movimientos, setMovimientos] = useState([])
  const [datosCargados, setDatosCargados] = useState(false)
  const [pedidoItems, setPedidoItems] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [editando, setEditando] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [appInstalada, setAppInstalada] = useState(false)

  // En escritorio el menú queda visible por defecto; al pasar a móvil se minimiza.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const onCambio = (e) => {
      setEsEscritorio(e.matches);
      setSidebarOpen(e.matches);
    };
    if (mq.addEventListener) mq.addEventListener('change', onCambio);
    else if (mq.addListener) mq.addListener(onCambio);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onCambio);
      else if (mq.removeListener) mq.removeListener(onCambio);
    };
  }, []);

  // Al abrir la app, carga el estado guardado en este dispositivo
  useEffect(() => {
    setDatosCargados(false);
    setPedidoItems([]);
    setEditando(null);
    (async () => {
      try {
        const estado = await obtenerEstadoGestor();
        setSaldo(estado.saldo ?? 0);
        const hoy = getTodayString();
        let resumen = estado.resumenDiario ?? RESUMEN_VACIO();
        if (!resumen.fecha || resumen.fecha !== hoy) resumen = RESUMEN_VACIO();
        setResumenDiario(resumen);
        setPeople(estado.clientes ?? []);
        setMovimientos(movimientosDeEstado(estado));
        setProducts(productosDeEstado(estado));
      } catch (e) {
        setSaldo(0);
        setResumenDiario(RESUMEN_VACIO());
        setPeople([]);
        setMovimientos([]);
        setProducts(productosDeRespaldo());
      }
      try {
        const raw = localStorage.getItem(`historial_bodega`);
        setPedidos(raw ? JSON.parse(raw) : []);
      } catch (e) {
        setPedidos([]);
      }
      setDatosCargados(true);
    })();
  }, []);

  // Efecto para reiniciar resumen diario si cambia el día (incluso sin recargar)
  useEffect(() => {
    const interval = setInterval(() => {
      const hoy = getTodayString();
      if (resumenDiario.fecha !== hoy) {
        setResumenDiario(RESUMEN_VACIO());
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [resumenDiario]);

  // Guarda el estado del gestor en este dispositivo
  useEffect(() => {
    if (!datosCargados) return;
    guardarEstadoGestor({
      saldo,
      resumenDiario,
      clientes: people,
      products,
      gastos: movimientos,
    });
  }, [saldo, resumenDiario, people, products, movimientos, datosCargados]);

  // Persistir el historial de pedidos en localStorage
  useEffect(() => {
    if (!datosCargados) return;
    try {
      localStorage.setItem(`historial_bodega`, JSON.stringify(pedidos));
    } catch (e) { }
  }, [pedidos, datosCargados]);

  // Instalación PWA
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const instalada = () => {
      setInstallPrompt(null);
      setAppInstalada(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', instalada);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', instalada);
    };
  }, []);

  const puedeInstalar = !!installPrompt && !appInstalada;

  const instalarApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } catch (e) { }
    setInstallPrompt(null);
  };

  const refresh = async () => {
    const estado = await obtenerEstadoGestor();
    setProducts(productosDeEstado(estado));
    setPeople(estado.clientes ?? []);
    setSaldo(estado.saldo ?? 0);
    setMovimientos(movimientosDeEstado(estado));
    const hoy = getTodayString();
    let resumen = estado.resumenDiario ?? RESUMEN_VACIO();
    if (!resumen.fecha || resumen.fecha !== hoy) resumen = RESUMEN_VACIO();
    setResumenDiario(resumen);
  };

  const navegar = (v) => {
    if (v === 'nuevoProducto') setEditando(null);
    if (v === 'venta' || v === 'compra') setPedidoItems([]);
    setView(v);
    if (!esEscritorio) setSidebarOpen(false);
  };

  const alternarMenu = () => setSidebarOpen(o => !o);

  // ---- Pedidos (Venta / Compra) ----
  const abrirVentaCon = (product) => {
    setPedidoItems(prev => {
      const ex = prev.find(i => i.key === product.id);
      if (ex) {
        return prev.map(i => i.key === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { key: product.id, product, precio: Number(product.price) || 0, qty: 1 }];
    });
    setView('venta');
  };

  const ajustarStock = (items, direccion) => {
    setProducts(prev => prev.map(p => {
      const it = items.find(i => (i.key ?? i.product?.id) === p.id);
      if (!it) return p;
      const actual = Number(p.stock) || 0;
      const nuevo = direccion === 'restar' ? Math.max(0, actual - it.qty) : actual + it.qty;
      return { ...p, stock: nuevo };
    }));
  };

  const confirmarVenta = ({ items, total, fiadoPersonaId }) => {
    const pedido = {
      id: generarId(),
      tipo: 'venta',
      fecha: new Date().toISOString(),
      items,
      total,
      fiadoPersonaId: fiadoPersonaId || null,
      fiadoDeudaId: null,
    };
    ajustarStock(items, 'restar');
    if (fiadoPersonaId) {
      const deudaId = generarId();
      pedido.fiadoDeudaId = deudaId;
      setPeople(prev => prev.map(p => p.id === fiadoPersonaId
        ? { ...p, debts: [...(p.debts || []), { id: deudaId, productId: null, amount: total, date: new Date().toISOString(), origen: 'venta' }] }
        : p));
    } else {
      const n = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
      agregarMovimiento({ tipo: 'ingreso', concepto: `Venta${n > 0 ? ` (${n} ${n === 1 ? 'producto' : 'productos'})` : ''}`, monto: total, pedidoId: pedido.id });
    }
    setPedidos(prev => [pedido, ...prev]);
    setPedidoItems([]);
    setView('historial');
  };

  const confirmarCompra = ({ items, total, proveedor }) => {
    const pedido = {
      id: generarId(),
      tipo: 'compra',
      fecha: new Date().toISOString(),
      items,
      total,
      proveedor: proveedor || null,
    };
    ajustarStock(items, 'sumar');
    const n = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    agregarMovimiento({ tipo: 'gasto', concepto: proveedor ? `Compra a ${proveedor}` : `Compra${n > 0 ? ` (${n} ${n === 1 ? 'producto' : 'productos'})` : ''}`, monto: total, pedidoId: pedido.id });
    setPedidos(prev => [pedido, ...prev]);
    setPedidoItems([]);
    setView('historial');
  };

  // ---- Movimientos (ingresos y gastos) ----
  // Unifica el registro: suma/resta del saldo, actualiza el resumen diario y agrega la lista.
  const agregarMovimiento = ({ tipo, concepto, monto, pedidoId = null }) => {
    const montoNum = Number(monto) || 0;
    if (montoNum <= 0) return;
    const esIngreso = tipo === 'ingreso';
    const mov = {
      id: generarId(),
      tipo: esIngreso ? 'ingreso' : 'gasto',
      concepto: concepto || (esIngreso ? 'Ingreso' : 'Gasto'),
      monto: montoNum,
      fecha: new Date().toISOString(),
      pedidoId,
    };
    setMovimientos(prev => [mov, ...prev]);
    setSaldo(s => s + (esIngreso ? montoNum : -montoNum));
    setResumenDiario(r => {
      const ingresos = (r.ingresos || 0) + (esIngreso ? montoNum : 0);
      const gastos = (r.gastos || 0) + (esIngreso ? 0 : montoNum);
      return { ...r, ingresos, gastos, diferencia: ingresos - gastos };
    });
    return mov;
  };

  const registrarMovimiento = ({ tipo, concepto, monto }) => {
    agregarMovimiento({ tipo, concepto, monto });
  };

  const eliminarMovimiento = (id) => {
    const mov = movimientos.find(m => m.id === id);
    if (!mov || mov.pedidoId) return;
    const esIngreso = mov.tipo === 'ingreso';
    setMovimientos(prev => prev.filter(m => m.id !== id));
    setSaldo(s => s - (esIngreso ? mov.monto : -mov.monto));
    if (mov.fecha && mov.fecha.slice(0, 10) === getTodayString()) {
      setResumenDiario(r => {
        const ingresos = Math.max(0, (r.ingresos || 0) - (esIngreso ? mov.monto : 0));
        const gastos = Math.max(0, (r.gastos || 0) - (esIngreso ? 0 : mov.monto));
        return { ...r, ingresos, gastos, diferencia: ingresos - gastos };
      });
    }
  };

  // ---- Productos ----
  const guardarProducto = async (prod) => {
    try {
      if (prod.id) {
        const actualizado = await db.updateProduct({ ...prod });
        if (!actualizado) {
          alert('No se encontró el producto para actualizar. Cierra y vuelve a abrir la app para cargar la versión más reciente.');
          return;
        }
      } else {
        await db.addProduct(prod);
      }
      await refresh();
    } catch (e) {
      alert('Error al guardar producto: ' + (e.message || e));
    }
    setEditando(null);
    setView('catalogo');
  };

  const editarProducto = (prod) => {
    setEditando(prod);
    setView('nuevoProducto');
  };

  const eliminarProducto = async (prod) => {
    if (!confirm(`¿Eliminar "${prod.name}"?`)) return;
    try {
      await db.deleteProduct(prod.id);
      await refresh();
    } catch (e) {
      alert('Error al eliminar producto: ' + (e.message || e));
    }
  };

  // ---- Caja y Fiados ----
  const agregarPersona = (nombre) => {
    setPeople(prev => [...prev, { id: generarId(), name: nombre.trim(), debts: [] }]);
  };

  const ajustarDeuda = (personaId, monto) => {
    const montoNum = Number(monto) || 0;
    if (montoNum === 0) return;
    const persona = people.find(p => p.id === personaId);
    if (!persona) return;
    const esAbono = montoNum < 0;
    setPeople(prev => prev.map(p => p.id === personaId
      ? { ...p, debts: [...(p.debts || []), { id: generarId(), productId: null, amount: montoNum, date: new Date().toISOString(), origen: esAbono ? 'abono' : 'manual' }] }
      : p));
    // Un abono (pago) de un fiado ingresa automáticamente a la caja.
    if (esAbono) {
      agregarMovimiento({ tipo: 'ingreso', concepto: `Abono de ${persona.name}`, monto: Math.abs(montoNum) });
    }
  };

  // ---- Deshacer un pedido del historial ----
  const deshacerPedido = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    if (!window.confirm(`¿Deshacer ${pedido.tipo === 'venta' ? 'esta venta' : 'esta compra'}? Se revertirá el stock, la caja y el resumen del día.`)) return;

    const esHoy = pedido.fecha && pedido.fecha.slice(0, 10) === getTodayString();
    const total = Number(pedido.total) || 0;

    setProducts(prev => prev.map(p => {
      const it = (pedido.items || []).find(x => (x.product && x.product.id) === p.id);
      if (!it) return p;
      const actual = Number(p.stock) || 0;
      const nuevo = pedido.tipo === 'venta' ? actual + it.qty : Math.max(0, actual - it.qty);
      return { ...p, stock: nuevo };
    }));

    if (pedido.tipo === 'venta' && !pedido.fiadoPersonaId && total > 0) {
      setSaldo(s => s - total);
      if (esHoy) {
        setResumenDiario(r => {
          const ingresos = Math.max(0, (r.ingresos || 0) - total);
          return { ...r, ingresos, diferencia: ingresos - (r.gastos || 0) };
        });
      }
    } else if (pedido.tipo === 'compra' && total > 0) {
      setSaldo(s => s + total);
      if (esHoy) {
        setResumenDiario(r => {
          const gastos = Math.max(0, (r.gastos || 0) - total);
          return { ...r, gastos, diferencia: (r.ingresos || 0) - gastos };
        });
      }
    }

    if (pedido.tipo === 'venta' && pedido.fiadoPersonaId && pedido.fiadoDeudaId) {
      setPeople(prev => prev.map(p => p.id === pedido.fiadoPersonaId
        ? { ...p, debts: (p.debts || []).filter(d => d.id !== pedido.fiadoDeudaId) }
        : p));
    }

    setMovimientos(prev => prev.filter(m => m.pedidoId !== pedidoId));
    setPedidos(prev => prev.filter(p => p.id !== pedidoId));
  };

  // ---- Respaldo ----
  const exportarDatos = async () => {
    const estado = await obtenerEstadoGestor();
    let historial = [];
    try {
      const raw = localStorage.getItem(`historial_bodega`);
      if (raw) historial = JSON.parse(raw);
    } catch (e) { }
    const data = {
      app: 'bodegalista',
      version: 1,
      exportado: new Date().toISOString(),
      estado,
      historial,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bodegalista_respaldo_${getTodayString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const importarDatos = async (file) => {
    const texto = await file.text();
    const data = JSON.parse(texto);
    if (!data || !data.estado || typeof data.estado !== 'object') {
      throw new Error('Respaldo inválido');
    }
    localStorage.setItem(`bodegalista_estado`, JSON.stringify(data.estado));
    localStorage.setItem(`historial_bodega`, JSON.stringify(data.historial || []));
    window.location.reload();
  };

  const pedidoCount = pedidoItems.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-[max(7rem,env(safe-area-inset-bottom))] flex">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={alternarMenu}
        view={view}
        onNavigate={navegar}
        puedeInstalar={puedeInstalar}
        onInstalar={instalarApp}
        esEscritorio={esEscritorio}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          onOpenMenu={alternarMenu}
          onOpenCart={() => setView('venta')}
          cartCount={pedidoCount}
          puedeInstalar={puedeInstalar}
          onInstalar={instalarApp}
          esEscritorio={esEscritorio}
        />
        <Banner />

      <main>
        {view === 'catalogo' && (
          <Catalogo
            products={products}
            onAddToCart={abrirVentaCon}
            onNuevoProducto={() => { setEditando(null); setView('nuevoProducto'); }}
            onEditar={editarProducto}
            onEliminar={eliminarProducto}
          />
        )}
        {view === 'nuevoProducto' && (
          <NuevoProducto
            editando={editando}
            onGuardar={guardarProducto}
            onCancelar={() => setView('catalogo')}
          />
        )}
        {view === 'venta' && (
          <Pedido
            products={products}
            people={people}
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
            people={people}
            tipo="compra"
            items={pedidoItems}
            setItems={setPedidoItems}
            onConfirmarVenta={confirmarVenta}
            onConfirmarCompra={confirmarCompra}
            onVolver={() => setView('catalogo')}
          />
        )}
        {view === 'historial' && (
          <Historial pedidos={pedidos} people={people} onDeshacer={deshacerPedido} onVolver={() => setView('catalogo')} />
        )}
        {view === 'caja' && (
          <CajaYFiados
            saldo={saldo}
            resumenDiario={resumenDiario}
            people={people}
            onAgregarPersona={agregarPersona}
            onAjustarDeuda={ajustarDeuda}
            movimientos={movimientos}
            onRegistrarMovimiento={registrarMovimiento}
            onEliminarMovimiento={eliminarMovimiento}
          />
        )}
        {view === 'reportes' && (
          <Reportes pedidos={pedidos} onVolver={() => setView('catalogo')} />
        )}
        {view === 'respaldo' && (
          <Respaldo
            onExportar={exportarDatos}
            onImportar={importarDatos}
            onVolver={() => setView('catalogo')}
          />
        )}
      </main>
      </div>

      {view !== 'venta' && view !== 'compra' && <Fab onClick={() => setView('venta')} count={pedidoCount} />}
    </div>
  );
}
