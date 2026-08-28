import React, { useRef, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

const CATEGORIAS = ['General', 'Limpieza', 'Víveres', 'Dulces'];

function formatearMoneda(n) {
  const formato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  if (!n && n !== 0) return formato.format(0);
  return formato.format(Number(n));
}

// Parsea números escritos en formato colombiano:
//   "1.500"  -> 1500   (punto = separador de miles)
//   "1.500,5" -> 1500.5 (coma = decimal)
//   "1500"   -> 1500
function parseNumero(v) {
  if (v == null) return NaN;
  let s = String(v).trim();
  if (s === '') return NaN;
  s = s.replace(/\s+/g, '');
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes('.')) {
    const partes = s.split('.');
    const ultima = partes[partes.length - 1];
    if (ultima.length === 3) s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? NaN : n;
}

export default function NuevoProducto({ onGuardar, onCancelar, editando = null }) {
  const [nombre, setNombre] = useState(editando?.name || '');
  const [precio, setPrecio] = useState(editando?.price != null ? String(editando.price) : '');
  const [precioCompra, setPrecioCompra] = useState(editando?.costPrice != null ? String(editando.costPrice) : '');
  const [stock, setStock] = useState(editando?.stock != null ? String(editando.stock) : '');
  const [categoria, setCategoria] = useState(editando?.category || 'General');
  const [imagen, setImagen] = useState(editando?.image || '');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const manejarImagen = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagen(reader.result);
    reader.readAsDataURL(file);
  };

  const previewPrecio = precio.trim() === '' ? '' : formatearMoneda(parseNumero(precio));

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) return setError('Escribe el nombre del producto.');

    const precioNum = parseNumero(precio);
    if (Number.isNaN(precioNum)) return setError('Escribe un precio de venta válido.');

    const costPriceNum = precioCompra.trim() === '' ? 0 : parseNumero(precioCompra);
    if (Number.isNaN(costPriceNum) || costPriceNum < 0) return setError('Escribe un precio de compra válido.');

    const stockNum = stock.trim() === '' ? 0 : parseInt(String(stock).replace(/\D/g, ''), 10);
    if (Number.isNaN(stockNum) || stockNum < 0) return setError('Escribe una cantidad de stock válida.');

    try {
      await onGuardar({
        id: editando?.id || null,
        name: nombre.trim(),
        price: precioNum,
        costPrice: costPriceNum,
        category: categoria,
        image: imagen || null,
        stock: stockNum,
      });
    } catch (err) {
      console.error('Error guardando producto:', err);
      setError('Error al guardar: ' + (err.message || 'Error desconocido'));
    }
  };

  const inputEstilos = "border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500";

  return (
    <section className="max-w-lg mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {editando ? 'Editar producto' : 'Nuevo producto'}
        </h2>

        <form onSubmit={guardar} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Nombre del producto
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Arroz Mary 1kg"
              className={inputEstilos}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Precio de venta
            <input
              type="text"
              inputMode="decimal"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              onFocus={e => e.target.select()}
              placeholder="0"
              className={inputEstilos}
            />
            {previewPrecio && (
              <span className="text-xs text-emerald-600 font-semibold">
                = {previewPrecio}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Precio de compra (lo que pagas al proveedor)
            <input
              type="text"
              inputMode="decimal"
              value={precioCompra}
              onChange={e => setPrecioCompra(e.target.value)}
              onFocus={e => e.target.select()}
              placeholder="0"
              className={inputEstilos}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Cantidad en stock
            <input
              type="text"
              inputMode="numeric"
              value={stock}
              onChange={e => setStock(e.target.value)}
              onFocus={e => e.target.select()}
              placeholder="0"
              className={inputEstilos}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Categoría
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className={`${inputEstilos} bg-white`}
            >
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Imagen
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={manejarImagen}
              className="border border-gray-200 rounded-lg px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-medium hover:file:bg-emerald-100 cursor-pointer"
            />
            {imagen && (
              <img src={imagen} alt="Vista previa" className="w-16 h-16 object-contain mt-2 rounded-lg border border-gray-100" />
            )}
          </label>

          <p className="text-xs text-gray-400">
            Para cantidades usa punto para los miles y coma para los decimales. Ej.: 1.500 o 2.500,50
          </p>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancelar}
              className="flex items-center justify-center gap-2 flex-1 bg-emerald-500/80 text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-emerald-500/90 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 flex-1 bg-emerald-600 text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-emerald-700 active:scale-95 transition"
            >
              <Save className="w-4 h-4" />
              {editando ? 'Guardar cambios' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
