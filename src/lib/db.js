// Capa de datos local-only: localStorage como almacenamiento

import { obtenerEstadoGestor, guardarEstadoGestor } from '../gestorLocal'

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

// Simple event emitter so UI puede suscribirse a cambios de la DB.
const _listeners = new Set()
export function subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn) }
export function unsubscribe(fn) { _listeners.delete(fn) }
function notifyChange(detail) { try { for (const l of Array.from(_listeners)) { try { l(detail) } catch(e){ console.warn('[db] listener error', e) } } } catch(e){} }

export async function getProducts() {
  const estado = await obtenerEstadoGestor()
  if (!estado.products || !Array.isArray(estado.products)) estado.products = [];
  return estado.products;
}

export async function addProduct(prod) {
  const estado = await obtenerEstadoGestor() || {}
  if (!estado.products || !Array.isArray(estado.products)) estado.products = [];
  const item = { id: generateId(), name: prod.name, price: prod.price || 0, costPrice: prod.costPrice || 0, category: prod.category || 'General', image: prod.image || null, stock: Number.isFinite(Number(prod.stock)) ? Math.max(0, Number(prod.stock)) : 0 }
  estado.products.push(item)
  await guardarEstadoGestor({ ...estado, products: estado.products })
  notifyChange({ type: 'products', action: 'add', item })
  return item
}

export async function updateProduct(prod) {
  const estado = await obtenerEstadoGestor() || {}
  if (!estado.products || !Array.isArray(estado.products)) estado.products = [];
  let idx = estado.products.findIndex(x => x.id === prod.id)
  // Si el id no coincide (datos viejos o duplicados), busca por nombre
  if (idx === -1 && prod.name) {
    idx = estado.products.findIndex(x => (x.name || x.nombre) === prod.name)
  }
  if (idx === -1) return null
  estado.products[idx] = { ...estado.products[idx], ...prod }
  await guardarEstadoGestor({ ...estado, products: estado.products })
  notifyChange({ type: 'products', action: 'update', item: estado.products[idx] })
  return estado.products[idx]
}

export async function deleteProduct(productId) {
  const estado = await obtenerEstadoGestor() || {}
  if (!estado.products || !Array.isArray(estado.products)) estado.products = [];
  const antes = estado.products.length
  estado.products = estado.products.filter(x => x.id !== productId)
  if (estado.products.length === antes) return false
  await guardarEstadoGestor({ ...estado, products: estado.products })
  notifyChange({ type: 'products', action: 'delete', productId })
  return true
}
