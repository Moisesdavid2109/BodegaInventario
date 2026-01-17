import React, { useEffect, useState } from 'react'
import Nav from './components/Nav'
import Catalog from './components/Catalog'
import Accounts from './components/Accounts'
import * as db from './lib/db'

export default function App() {
  const [view, setView] = useState('catalog')
  const [products, setProducts] = useState([])
  const [people, setPeople] = useState([])

  useEffect(() => {
    setProducts(db.getProducts())
    setPeople(db.getPeople())
  }, [])

  const refresh = () => {
    setProducts(db.getProducts())
    setPeople(db.getPeople())
  }

  return (
    <div className="app">
      <Nav view={view} setView={setView} />
      <main>
        {view === 'catalog' && (
          <Catalog products={products} onAdd={() => refresh()} />
        )}
        {view === 'accounts' && (
          <Accounts
            people={people}
            products={products}
            onChange={() => refresh()}
          />
        )}
      </main>
    </div>
  )
}
