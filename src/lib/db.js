// Capa de datos simple: usa localStorage por defecto. Puedes conectar Firestore en src/firebase.js
import defaultData from '../data/products.json'
const LS_KEY = 'bodega_data_v1'

function read() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) {
    return { products: [], people: [] }
  }
  try { return JSON.parse(raw) } catch { return { products: [], people: [] } }
}

function write(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8)
}

export function getProducts() {
  // Prefer products from JSON seed if available (no need to clear localStorage)
  if (defaultData && Array.isArray(defaultData.products) && defaultData.products.length > 0) {
    return (defaultData.products || []).map(p => ({
      id: p.id || uid(),
      name: p.name || p.nombre || 'Producto',
      price: p.price ?? p.precio ?? null,
      category: p.category || p.categoria || 'General',
      sku: p.sku || p.SKU || null,
      image: p.image || p.imagen || null
    }))
  }
  return read().products
}

export function addProduct(prod) {
  const data = read()
  const item = {
    id: uid(),
    name: prod.name,
    price: prod.price || 0,
    category: prod.category || 'General',
    sku: prod.sku || null
  }
  data.products.push(item)
  write(data)
  return item
}

export function getPeople() {
  const data = read()
  // expand debts with product name
  return data.people.map(p => ({
    ...p,
    debts: (p.debts||[]).map(d => ({
      ...d,
      productName: data.products.find(x=>x.id===d.productId)?.name
    }))
  }))
}

export function addPerson(person) {
  const data = read()
  const item = { id: uid(), name: person.name, debts: [] }
  data.people.push(item)
  write(data)
  return item
}

export function addDebt(personId, debt) {
  const data = read()
  const p = data.people.find(x => x.id === personId)
  if (!p) return null
  const item = {
    productId: debt.productId || null,
    amount: debt.amount || 0,
    date: debt.date || new Date().toISOString()
  }
  p.debts = p.debts || []
  p.debts.push(item)
  write(data)
  return item
}

export function clearAll() {
  localStorage.removeItem(LS_KEY)
}

export function clearPeople() {
  const data = read()
  data.people = []
  write(data)
}

// Cash / saldo global simple
export function getCash() {
  const data = read()
  return Number(data.cash) || 0
}

export function setCash(value) {
  const data = read()
  data.cash = Number(value) || 0
  write(data)
  return data.cash
}

export function addCash(amount) {
  const data = read()
  data.cash = (Number(data.cash) || 0) + Number(amount || 0)
  write(data)
  return data.cash
}

// Note: products are now read directly from `src/data/products.json` when present.
