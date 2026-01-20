
import React, { useEffect, useState } from 'react'
import Nav from './components/Nav'
import Catalog from './components/Catalog'
import Accounts from './components/Accounts'
import * as db from './lib/db'
import { guardarEstadoGestor } from './gestorFirestore'

export default function App() {
  const [view, setView] = useState('catalog')
  const [products, setProducts] = useState([])
  const [people, setPeople] = useState([])

  // El saldo y resumen diario se inicializan vacíos y se cargan desde la base local
  const [saldo, setSaldo] = useState(0)
  const [resumenDiario, setResumenDiario] = useState({ ingresos: 0, gastos: 0, diferencia: 0 })

  // Guarda el estado del gestor en Firestore cada vez que cambian los datos
  useEffect(() => {
    guardarEstadoGestor({
      saldo,
      resumenDiario,
      clientes: people
    })
  }, [saldo, resumenDiario, people])

  useEffect(() => {
    (async () => {
      const prods = await db.getProducts()
      const ppl = await db.getPeople()
      const cash = await db.getCash()
      setProducts(prods)
      setPeople(ppl)
      setSaldo(cash)
    })()
    const unsub = db.subscribe(async (detail) => {
      const prods = await db.getProducts()
      const ppl = await db.getPeople()
      const cash = await db.getCash()
      setProducts(prods)
      setPeople(ppl)
      setSaldo(cash)
    })
    return () => { unsub() }
  }, [])

  const refresh = async () => {
    const prods = await db.getProducts()
    const ppl = await db.getPeople()
    setProducts(prods)
    setPeople(ppl)
  }

  return (
    <div className="app">
      <Nav view={view} setView={setView} people={people} />
      <main>
        {view === 'catalog' && (
          <Catalog
            products={products}
            onAdd={() => refresh()}
          />
        )}
        {view === 'accounts' && (
          <Accounts
            people={people}
            products={products}
            saldo={saldo}
            setSaldo={setSaldo}
            resumenDiario={resumenDiario}
            setResumenDiario={setResumenDiario}
            onChange={() => refresh()}
          />
        )}
      </main>
    </div>
  )
}