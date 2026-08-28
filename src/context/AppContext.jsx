import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as fs from '../lib/firestore';
import defaultData from '../data/products.json';

const AppContext = createContext(null);

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function normalizarCategoria(c) {
  const s = String(c || 'General').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (s.startsWith('dulce')) return 'Dulces';
  if (s.startsWith('viver')) return 'Víveres';
  if (s.startsWith('limp')) return 'Limpieza';
  return 'General';
}

function normalizarProducto(p) {
  return {
    id: p.id || p.name || p.nombre || Math.random().toString(36).slice(2, 8),
    name: p.name || p.nombre || '',
    category: normalizarCategoria(p.category || p.categoria),
    image: p.image || p.imagen || null,
    stock: Number(p.stock ?? 0) || 0,
  };
}

function productosDefault() {
  return (defaultData.products || []).map(normalizarProducto);
}

function useHoyUpdater(setHoy) {
  useEffect(() => {
    const verificar = () => {
      const nuevaFecha = getTodayString();
      setHoy(prev => prev === nuevaFecha ? prev : nuevaFecha);
    };
    verificar();
    const id = setInterval(verificar, 30000);
    return () => clearInterval(id);
  }, [setHoy]);
}

export function AppProvider({ children }) {
  const [perfilActivo, setPerfilActivo] = useState(() => {
    try { return JSON.parse(localStorage.getItem('perfil_activo')); } catch { return null; }
  });
  const [cargando, setCargando] = useState(true);

  const [productosShared, setProductosShared] = useState([]);
  const [preciosMap, setPreciosMap] = useState({});
  const [stockMap, setStockMap] = useState({});
  const [people, setPeople] = useState([]);
  const [movimientosGeneral, setMovimientosGeneral] = useState([]);
  const [transaccionesBanco, setTransaccionesBanco] = useState([]);
  const [fiados, setFiados] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [hoy, setHoy] = useState(getTodayString);

  useHoyUpdater(setHoy);

  const perfilId = perfilActivo?.id;

  // Merge: productos compartidos + precios y stock del perfil
  const products = useMemo(() => {
    return productosShared.map(p => {
      const precio = preciosMap[p.id];
      return {
        ...p,
        name: p.name || p.nombre || '',
        category: p.category || p.categoria || 'General',
        image: p.image || p.imagen || null,
        stock: stockMap[p.id] != null ? stockMap[p.id] : 0,
        price: precio?.price ?? 0,
        costPrice: precio?.costPrice ?? 0,
      };
    });
  }, [productosShared, preciosMap, stockMap]);

  // Escuchar productos compartidos + precios del perfil + datos
  useEffect(() => {
    if (!perfilId) { setCargando(false); return; }
    setCargando(true);

    let firstProductsLoad = true;

    const unsubProductos = fs.escucharProductos(async (p) => {
      setProductosShared(p);
      if (firstProductsLoad && p.length > 0) {
        firstProductsLoad = false;
        try { await fs.migrarProductosIds(); } catch (e) { console.error('Migración IDs:', e); }
      }
      if (firstProductsLoad && p.length === 0) {
        firstProductsLoad = false;
        try {
          const defaults = productosDefault();
          if (defaults.length > 0) await fs.sembrarProductos(defaults);
        } catch (e) { console.error('Error sembrando productos:', e); }
      }
      if (firstProductsLoad) firstProductsLoad = false;
    });

    const unsubPrecios = fs.escucharPrecios(perfilId, (mapa) => {
      setPreciosMap(mapa);
    });

    const unsubStock = fs.escucharStock(perfilId, (mapa) => setStockMap(mapa));

    const unsubBanco = fs.escucharTransaccionesBanco(perfilId, (t) => setTransaccionesBanco(t));
    const unsubFiados = fs.escucharFiados(perfilId, (f) => setFiados(f));
    const unsubPedidos = fs.escucharPedidos(perfilId, (p) => setPedidos(p));
    const unsubClientes = fs.escucharClientes(perfilId, (c) => setClientes(c));

    setCargando(false);

    return () => {
      unsubProductos?.();
      unsubPrecios?.();
      unsubStock?.();
      unsubBanco?.();
      unsubFiados?.();
      unsubPedidos?.();
      unsubClientes?.();
    };
  }, [perfilId]);

  // Control general (caja total, sin separación por día)
  useEffect(() => {
    if (!perfilId) { setMovimientosGeneral([]); return; }
    const unsub = fs.escucharControlGeneral(perfilId, (m) => setMovimientosGeneral(m));
    return () => unsub?.();
  }, [perfilId]);

  useEffect(() => {
    if (!perfilId) return;
    fs.obtenerPerfiles().then(p => setPeople(p)).catch(() => {});
  }, [perfilId]);

  const login = useCallback(async (perfil, pin) => {
    if (perfil.pin === pin) {
      setPerfilActivo(perfil);
      localStorage.setItem('perfil_activo', JSON.stringify(perfil));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setPerfilActivo(null);
    localStorage.removeItem('perfil_activo');
    setProductosShared([]);
    setPreciosMap({});
    setStockMap({});
    setPeople([]);
    setMovimientosGeneral([]);
    setTransaccionesBanco([]);
    setFiados([]);
    setPedidos([]);
    setClientes([]);
  }, []);

  // ── Bancos ──
  const agregarTransaccionBanco = useCallback(async (data) => {
    return await fs.agregarTransaccionBanco(perfilId, data);
  }, [perfilId]);

  const eliminarTransaccionBanco = useCallback(async (id) => {
    await fs.eliminarTransaccionBanco(id);
  }, []);

  // ── Fiados ──
  const agregarFiado = useCallback(async (data) => {
    await fs.agregarFiado(perfilId, data);
  }, [perfilId]);

  const registrarPagoFiado = useCallback(async (fiadoId, monto) => {
    await fs.registrarPagoFiado(fiadoId, {
      id: generarId(), monto, fecha: new Date().toISOString(),
    });
    if (perfilId) {
      await fs.agregarMovimientoGeneral(perfilId, {
        tipo: 'ingreso', concepto: 'Abono de fiado', monto,
      });
    }
  }, [perfilId]);

  const actualizarFiado = useCallback(async (id, data) => {
    await fs.actualizarFiado(id, data);
  }, []);

  // ── Pedidos ──
  const agregarPedido = useCallback(async (pedido) => {
    return fs.agregarPedido(perfilId, pedido);
  }, [perfilId]);

  const eliminarPedido = useCallback(async (id) => {
    await fs.eliminarPedido(id);
  }, []);

  // ── Productos (catálogo compartido) ──
  const agregarProducto = useCallback(async (prod, precioVenta, precioCompra, stock) => {
    const { stock: stockShared, ...producto } = prod;
    const docRef = await fs.agregarProducto(producto);
    if (perfilId) {
      await fs.guardarPrecio(perfilId, docRef.id, precioVenta || 0, precioCompra || 0);
      await fs.guardarStock(perfilId, docRef.id, stock ?? stockShared ?? 0);
    }
    return docRef;
  }, [perfilId]);

  const actualizarProducto = useCallback(async (id, data) => {
    await fs.actualizarProducto(id, data);
  }, []);

  const actualizarPrecio = useCallback(async (productId, price, costPrice) => {
    if (perfilId) await fs.guardarPrecio(perfilId, productId, price, costPrice);
  }, [perfilId]);

  const actualizarStock = useCallback(async (productId, stock) => {
    if (perfilId) await fs.guardarStock(perfilId, productId, stock);
  }, [perfilId]);

  const eliminarProducto = useCallback(async (id) => {
    await fs.eliminarProducto(id);
  }, []);

  // ── Perfiles ──
  const crearPerfil = useCallback(async (nombre, pin) => {
    return fs.crearPerfil(nombre, pin);
  }, []);

  const borrarCuenta = useCallback(async () => {
    if (!perfilId) return;
    await fs.borrarCuenta(perfilId);
    logout();
  }, [perfilId, logout]);

  // ── Clientes ──
  const crearCliente = useCallback(async (data) => {
    await fs.crearCliente(perfilId, data);
  }, [perfilId]);

  const eliminarCliente = useCallback(async (id) => {
    await fs.eliminarCliente(id);
  }, []);

  // ── Control General (Caja) ──
  const agregarMovimientoGeneralWrapper = useCallback(async (data) => {
    await fs.agregarMovimientoGeneral(perfilId, data);
  }, [perfilId]);

  const eliminarMovimientoGeneralWrapper = useCallback(async (id) => {
    await fs.eliminarMovimientoGeneral(id);
  }, []);

  // ── Derivados ──
  const totalBancoHoy = transaccionesBanco
    .filter(t => String(t.fecha || '').slice(0, 10) === hoy)
    .reduce((s, t) => {
      const val = Number(t.monto) || 0;
      return s + (t.tipo === 'gasto' ? -val : val);
    }, 0);

  const totalBanco = transaccionesBanco
    .reduce((s, t) => {
      const val = Number(t.monto) || 0;
      return s + (t.tipo === 'gasto' ? -val : val);
    }, 0);

  const ingresosTotales = movimientosGeneral.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + (Number(m.monto) || 0), 0);
  const gastosTotales = movimientosGeneral.filter(m => m.tipo === 'gasto').reduce((s, m) => s + (Number(m.monto) || 0), 0);

  const ingresosHoy = movimientosGeneral
    .filter(m => m.tipo === 'ingreso' && String(m.fecha || '').slice(0, 10) === hoy)
    .reduce((s, m) => s + (Number(m.monto) || 0), 0);
  const gastosHoy = movimientosGeneral
    .filter(m => m.tipo === 'gasto' && String(m.fecha || '').slice(0, 10) === hoy)
    .reduce((s, m) => s + (Number(m.monto) || 0), 0);

  const fiadosPendientes = fiados.filter(f => f.estado === 'pendiente');
  const fiadosVencidos = fiadosPendientes.filter(f => f.fechaLimitePago && f.fechaLimitePago < hoy);
  const totalPorCobrar = fiadosPendientes.reduce((s, f) => s + ((Number(f.montoTotal) || 0) - (Number(f.montoPagado) || 0)), 0);

  const ventasEfectivoHoy = pedidos
    .filter(p => p.tipo === 'venta' && !p.fiadoPersonaId && String(p.fecha || '').slice(0, 10) === hoy)
    .reduce((s, p) => s + (Number(p.total) || 0), 0);

  const exportarRespaldo = useCallback(async () => {
    const datos = {
      version: 1,
      fecha: new Date().toISOString(),
      perfilId,
      productos: products,
      pedidos,
      fiados,
      transaccionesBanco,
      movimientosGeneral,
      clientes,
    };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-bodega-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [products, pedidos, fiados, transaccionesBanco, movimientosGeneral, clientes, perfilId]);

  const importarRespaldo = useCallback(async (file) => {
    const text = await file.text();
    const datos = JSON.parse(text);
    if (!datos || !datos.version) throw new Error('Archivo inválido');
    for (const p of (datos.productos || [])) {
      const { id, ...rest } = p;
      if (id) {
        await fs.actualizarProducto(id, rest).catch(() => fs.agregarProducto({ id, ...rest }));
        if (p.stock != null) await fs.guardarStock(perfilId, id, Number(p.stock) || 0);
      }
    }
    for (const p of (datos.pedidos || [])) {
      await fs.agregarPedido(perfilId, p);
    }
    for (const f of (datos.fiados || [])) {
      await fs.agregarFiado(perfilId, f);
    }
    for (const t of (datos.transaccionesBanco || [])) {
      await fs.agregarTransaccionBanco(perfilId, t);
    }
    for (const m of (datos.movimientosGeneral || datos.movimientosCaja || [])) {
      await fs.agregarMovimientoGeneral(perfilId, m);
    }
    for (const c of (datos.clientes || [])) {
      await fs.crearCliente(perfilId, c);
    }
  }, [perfilId]);

  const valor = {
    perfilActivo, cargando, login, logout, crearPerfil, borrarCuenta,
    products, agregarProducto, actualizarProducto, actualizarPrecio, actualizarStock, eliminarProducto,
    people,
    clientes, crearCliente, eliminarCliente,
    movimientosGeneral,
    agregarMovimientoGeneral: agregarMovimientoGeneralWrapper,
    eliminarMovimientoGeneral: eliminarMovimientoGeneralWrapper,
    transaccionesBanco, agregarTransaccionBanco, eliminarTransaccionBanco, totalBancoHoy, totalBanco,
    fiados, fiadosPendientes, fiadosVencidos, totalPorCobrar,
    agregarFiado, registrarPagoFiado, actualizarFiado,
    pedidos, agregarPedido, eliminarPedido,
    ingresosTotales, gastosTotales, ingresosHoy, gastosHoy, ventasEfectivoHoy,
    exportarRespaldo, importarRespaldo,
  };

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
