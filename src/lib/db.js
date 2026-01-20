// Capa de datos local-only: localStorage + products.json como fallback
import defaultData from '../data/products.json'

const LS_KEY = 'bodega_data_v1'

function readLocal() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return { products: [], people: [], cash: 0, cashTx: [], notifDismissals: [] }
  try { return JSON.parse(raw) } catch { return { products: [], people: [], cash: 0, cashTx: [], notifDismissals: [] } }
}

function writeLocal(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)) }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

// Simple event emitter so UI puede suscribirse a cambios de la DB.
const _listeners = new Set()
export function subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn) }
export function unsubscribe(fn) { _listeners.delete(fn) }
function notifyChange(detail) { try { for (const l of Array.from(_listeners)) { try { l(detail) } catch(e){ console.warn('[db] listener error', e) } } } catch(e){} }

export async function getProducts() {
  try {
    const local = readLocal()
    if (local && Array.isArray(local.products) && local.products.length > 0) {
      return local.products.map(p => ({ id: p.id || uid(), name: p.name || p.nombre || 'Producto', price: p.price ?? p.precio ?? null, category: p.category || p.categoria || 'General', sku: p.sku || p.SKU || null, image: p.image || p.imagen || null }))
    }
  } catch (err) { console.warn('[db] error leyendo localStorage products:', err) }
  if (defaultData && Array.isArray(defaultData.products) && defaultData.products.length > 0) {
    return (defaultData.products || []).map(p => ({ id: p.id || uid(), name: p.name || p.nombre || 'Producto', price: p.price ?? p.precio ?? null, category: p.category || p.categoria || 'General', sku: p.sku || p.SKU || null, image: p.image || p.imagen || null }))
  }
  return []
}

export async function addProduct(prod) {
  const data = readLocal()
  const item = { id: uid(), name: prod.name, price: prod.price || 0, category: prod.category || 'General', sku: prod.sku || null }
  data.products = data.products || []
  data.products.push(item)
  writeLocal(data)
  notifyChange({ type: 'products', action: 'add', item })
  return item
}

export async function getPeople() { return (readLocal().people||[]).map(p => ({ ...p })) }

export async function addPerson(person) {
  const data = readLocal()
  const item = { id: uid(), name: person.name, debts: [] }
  data.people = data.people || []
  data.people.push(item)
  writeLocal(data)
  notifyChange({ type: 'people', action: 'add', item })
  return item
}

export async function addDebt(personId, debt) {
  const data = readLocal()
  const p = (data.people||[]).find(x=>x.id===personId)
  if (!p) return null
  const item = { productId: debt.productId || null, amount: debt.amount || 0, date: debt.date || new Date().toISOString() }
  p.debts = p.debts || []
  p.debts.push(item)
  writeLocal(data)
  notifyChange({ type: 'people', action: 'addDebt', personId, item })
  return item
}

export async function clearAll() { localStorage.removeItem(LS_KEY) }

export async function clearPeople() { const data = readLocal(); data.people = []; writeLocal(data); notifyChange({ type: 'people', action: 'clear' }) }

function readMeta() { return readLocal() }

function writeMeta(obj) { const data = readLocal(); Object.assign(data, obj); writeLocal(data); notifyChange({ type: 'meta', action: 'update' }) }

export async function getCash() { const meta = await readMeta(); return Number(meta.cash) || 0 }

export async function setCash(value) { writeMeta({ cash: Number(value) || 0 }); const meta = readMeta(); return Number(meta.cash) || 0 }

export async function addCash(amount) { const metaNow = readLocal(); metaNow.cash = (Number(metaNow.cash) || 0) + Number(amount || 0); metaNow.cashTx = metaNow.cashTx || []; metaNow.cashTx.push({ id: uid(), amount: Number(amount || 0), date: new Date().toISOString() }); writeLocal(metaNow); notifyChange({ type: 'meta', action: 'addCash', amount }); return metaNow.cash }

export async function getCashTransactions() { const meta = readMeta(); return meta.cashTx || [] }

export async function getNotifDismissals() { const meta = readMeta(); return meta.notifDismissals || [] }

export async function dismissNotification(personId) { const item = { personId, dismissedAt: new Date().toISOString() }; const data = readLocal(); data.notifDismissals = data.notifDismissals || []; if (!data.notifDismissals.find(x=>x.personId===personId)) data.notifDismissals.push(item); writeLocal(data); notifyChange({ type: 'meta', action: 'dismissNotification', personId }) }

export async function clearNotifDismissal(personId) { const data = readLocal(); data.notifDismissals = (data.notifDismissals||[]).filter(x=>x.personId!==personId); writeLocal(data); notifyChange({ type: 'meta', action: 'clearNotif', personId }) }

export async function clearAllNotifDismissals() { const data = readLocal(); data.notifDismissals = []; writeLocal(data); notifyChange({ type: 'meta', action: 'clearAllNotifDismissals' }) }

export async function getTodayCashSummary() { const tx = await getCashTransactions(); const today = new Date().toISOString().slice(0,10); let incomes = 0; let expenses = 0; tx.forEach(t => { if (!t || !t.date) return; if (t.date.slice(0,10) === today) { if (Number(t.amount) > 0) incomes += Number(t.amount); else expenses += Math.abs(Number(t.amount)) } }); return { incomes, expenses, net: incomes - expenses } }

// processQueue: no-op in local-only mode
export async function processQueue() { return { ok: true, applied: 0 } }

// Export / Import helpers for backups
export function exportData() { const data = readLocal(); return JSON.stringify(data, null, 2) }

export function importData(jsonStr) { try { const obj = JSON.parse(jsonStr); writeLocal(obj); notifyChange({ type: 'import' }); return { ok: true } } catch (err) { return { ok: false, message: err && err.message ? err.message : String(err) } } }
