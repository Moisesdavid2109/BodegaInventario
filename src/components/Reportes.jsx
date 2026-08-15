import React, { useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, PiggyBank, Trophy } from 'lucide-react';

function formatearMoneda(n) {
  const formato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  if (!n && n !== 0) return formato.format(0);
  return formato.format(Number(n));
}

function inicioPeriodo(filtro) {
  const now = new Date();
  if (filtro === 'hoy') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d;
  }
  if (filtro === 'semana') return new Date(now.getTime() - 6 * 24 * 3600 * 1000);
  if (filtro === 'mes') return new Date(now.getTime() - 29 * 24 * 3600 * 1000);
  return null;
}

function estaEnPeriodo(iso, corte) {
  if (!corte) return true;
  return new Date(iso) >= corte;
}

function formatoDia(iso) {
  try {
    return new Date(iso).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch (e) {
    return '';
  }
}

export default function Reportes({ pedidos = [], onVolver }) {
  const [periodo, setPeriodo] = useState('hoy'); // hoy | semana | mes | todo

  const stats = useMemo(() => {
    const corte = inicioPeriodo(periodo);
    const ventas = (pedidos || []).filter(p => p.tipo === 'venta' && estaEnPeriodo(p.fecha, corte));
    const compras = (pedidos || []).filter(p => p.tipo === 'compra' && estaEnPeriodo(p.fecha, corte));

    const totalVentas = ventas.reduce((s, p) => s + (Number(p.total) || 0), 0);
    const totalFiado = ventas.filter(p => p.fiadoPersonaId).reduce((s, p) => s + (Number(p.total) || 0), 0);
    const totalContado = totalVentas - totalFiado;
    const totalCompras = compras.reduce((s, p) => s + (Number(p.total) || 0), 0);

    let utilidad = 0;
    const porProducto = {};
    ventas.forEach(p => (p.items || []).forEach(it => {
      const costo = Number(it.product?.costPrice) || 0;
      const precio = Number(it.precio) || 0;
      utilidad += (precio - costo) * it.qty;
      const key = it.product?.id || it.product?.name || 'Otro';
      const nombre = it.product?.name || 'Producto';
      porProducto[key] = porProducto[key] || { nombre, qty: 0, monto: 0 };
      porProducto[key].qty += it.qty;
      porProducto[key].monto += precio * it.qty;
    }));
    const topProductos = Object.values(porProducto).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const porDia = {};
    ventas.forEach(p => {
      const dia = String(p.fecha || '').slice(0, 10);
      if (!dia) return;
      porDia[dia] = (porDia[dia] || 0) + (Number(p.total) || 0);
    });
    const ventasPorDia = Object.entries(porDia).map(([dia, monto]) => ({ dia, monto })).sort((a, b) => b.dia.localeCompare(a.dia));

    const nVentas = ventas.length;
    const nCompras = compras.length;

    return { totalVentas, totalCompras, utilidad, topProductos, ventasPorDia, nVentas, nCompras, totalContado, totalFiado };
  }, [pedidos, periodo]);

  const filtros = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Últimos 7 días' },
    { id: 'mes', label: 'Últimos 30 días' },
    { id: 'todo', label: 'Todo' },
  ];

  return (
    <section className="max-w-3xl mx-auto px-4 py-5">
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          Reportes y ganancias
        </h2>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl text-sm flex-wrap">
          {filtros.map(f => (
            <button
              key={f.id}
              onClick={() => setPeriodo(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                periodo === f.id ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Ventas
          </div>
          <div className="text-xl font-bold text-emerald-600">{formatearMoneda(stats.totalVentas)}</div>
          <div className="text-xs text-gray-300">{stats.nVentas} venta{stats.nVentas !== 1 ? 's' : ''}</div>
          <div className="text-xs text-emerald-600 mt-1">Contado: {formatearMoneda(stats.totalContado)}</div>
          <div className="text-xs text-amber-600">A fiado (por cobrar): {formatearMoneda(stats.totalFiado)}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
            Compras
          </div>
          <div className="text-xl font-bold text-blue-600">{formatearMoneda(stats.totalCompras)}</div>
          <div className="text-xs text-gray-300">{stats.nCompras} compra{stats.nCompras !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="bg-emerald-600 text-white rounded-2xl shadow-sm p-4 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium opacity-90">
          <PiggyBank className="w-5 h-5" />
          Utilidad estimada
        </div>
        <div className="text-xl font-bold">{formatearMoneda(stats.utilidad)}</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Top productos vendidos
        </h3>
        {stats.topProductos.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm">Sin ventas en este período.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {stats.topProductos.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm truncate">{p.nombre}</div>
                  <div className="text-xs text-gray-400">{p.qty} unidad{p.qty !== 1 ? 'es' : ''}</div>
                </div>
                <span className="text-emerald-600 font-bold text-sm">{formatearMoneda(p.monto)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-slate-900 mb-3 text-sm">Ventas por día</h3>
        {stats.ventasPorDia.length === 0 ? (
          <div className="text-center text-gray-400 py-4 text-sm">Sin datos en este período.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {stats.ventasPorDia.map((d, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 capitalize">{formatoDia(d.dia)}</span>
                <span className="font-semibold text-emerald-600">{formatearMoneda(d.monto)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
