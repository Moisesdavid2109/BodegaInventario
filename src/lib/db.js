// Capa de datos simple: usa localStorage por defecto. Puedes conectar Firestore en src/firebase.js
const LS_KEY = 'bodega_data_v1'

function read() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return { products: [], people: [] }
  try { return JSON.parse(raw) } catch { return { products: [], people: [] } }
}

function write(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8)
}

export function getProducts() {
  return read().products
}

export function addProduct(prod) {
  const data = read()
  const item = { id: uid(), name: prod.name, price: prod.price || 0 }
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
