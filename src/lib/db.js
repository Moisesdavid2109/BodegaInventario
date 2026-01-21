export { obtenerEstadoGestor } from '../gestorFirestore';
// Capa de datos local-only: localStorage + products.json como fallback




import { obtenerEstadoGestor, guardarEstadoGestor } from '../gestorFirestore'

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

// Simple event emitter so UI puede suscribirse a cambios de la DB.
const _listeners = new Set()
export function subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn) }
export function unsubscribe(fn) { _listeners.delete(fn) }
function notifyChange(detail) { try { for (const l of Array.from(_listeners)) { try { l(detail) } catch(e){ console.warn('[db] listener error', e) } } } catch(e){} }

// Todas las funciones requieren el UID del usuario
export async function getProducts(uid) {
  const estado = await obtenerEstadoGestor(uid)
  if (!estado.products || !Array.isArray(estado.products)) estado.products = [];
  return estado.products;
}

export async function addProduct(prod, uid) {
  const estado = await obtenerEstadoGestor(uid) || {}
  if (!estado.products || !Array.isArray(estado.products)) estado.products = [];
  const item = { id: generateId(), name: prod.name, price: prod.price || 0, category: prod.category || 'General', sku: prod.sku || null }
  estado.products.push(item)
  await guardarEstadoGestor({ ...estado, products: estado.products, uid })
  notifyChange({ type: 'products', action: 'add', item })
  return item
}

export async function getPeople(uid) {
  const estado = await obtenerEstadoGestor(uid)
  if (!estado.clientes || !Array.isArray(estado.clientes)) estado.clientes = [];
  return estado.clientes;
}

export async function addPerson(person, uid) {
  const estado = await obtenerEstadoGestor(uid) || {}
  if (!estado.clientes || !Array.isArray(estado.clientes)) estado.clientes = [];
  const item = { id: generateId(), name: person.name, debts: [] }
  estado.clientes.push(item)
  await guardarEstadoGestor({ ...estado, clientes: estado.clientes, uid })
  notifyChange({ type: 'people', action: 'add', item })
  return item
}

export async function addDebt(personId, debt, uid) {
  const estado = await obtenerEstadoGestor(uid) || {}
  if (!estado.clientes || !Array.isArray(estado.clientes)) estado.clientes = [];
  const p = estado.clientes.find(x => x.id === personId)
  if (!p) return null
  p.debts = p.debts || []
  p.debts.push(debt)
  await guardarEstadoGestor({ ...estado, clientes: estado.clientes, uid })
  notifyChange({ type: 'debt', action: 'add', personId, debt })
  return debt
}

export async function clearAll() { localStorage.removeItem(LS_KEY) }


// Las funciones de cash y notificaciones deben migrarse a Firestore si se requieren. Por ahora, eliminadas para evitar errores.
