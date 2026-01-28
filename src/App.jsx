
import React, { useEffect, useState } from 'react'
import Nav from './components/Nav'
import Catalog from './components/Catalog'
import Accounts from './components/Accounts'
import Auth from './components/Auth'
import * as db from './lib/db'
import { guardarEstadoGestor } from './gestorFirestore'

export default function App() {
  const [view, setView] = useState('catalog')
  const [products, setProducts] = useState([])
  const [people, setPeople] = useState([])

  // El saldo y resumen diario se inicializan vacíos y se cargan desde la base local
  const [saldo, setSaldo] = useState(0)
  // El resumen diario ahora incluye la fecha del día
  const [resumenDiario, setResumenDiario] = useState({ ingresos: 0, gastos: 0, diferencia: 0, fecha: getTodayString() })

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  function getTodayString() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }
  const [user, setUser] = useState(null)


  // Solo guardar en Firestore si los datos ya han sido cargados para el usuario actual
  const [datosCargados, setDatosCargados] = useState(false);

  // Al iniciar sesión, carga el estado del gestor desde Firestore
  useEffect(() => {
    if (!user) return;
    setDatosCargados(false);
    (async () => {
      // Cargar datos del gestor desde Firestore
      try {
        const estado = await import('./gestorFirestore').then(mod => mod.obtenerEstadoGestor(user.uid));
        if (estado) {
          setSaldo(estado.saldo ?? 0);
          // Si el resumen es de otro día, reiniciar
          const hoy = getTodayString();
          let resumen = estado.resumenDiario ?? { ingresos: 0, gastos: 0, diferencia: 0, fecha: hoy };
          if (!resumen.fecha || resumen.fecha !== hoy) {
            resumen = { ingresos: 0, gastos: 0, diferencia: 0, fecha: hoy };
          }
          setResumenDiario(resumen);
          setPeople(estado.clientes ?? []);
        } else {
          setSaldo(0);
          setResumenDiario({ ingresos: 0, gastos: 0, diferencia: 0, fecha: getTodayString() });
          setPeople([]);
        }
      } catch (e) {
        setSaldo(0);
        setResumenDiario({ ingresos: 0, gastos: 0, diferencia: 0, fecha: getTodayString() });
        setPeople([]);
      }
      setDatosCargados(true);
    })();
  }, [user]);

  // Efecto para reiniciar resumen diario si cambia el día (incluso sin recargar)
  useEffect(() => {
    const interval = setInterval(() => {
      const hoy = getTodayString();
      if (resumenDiario.fecha !== hoy) {
        setResumenDiario({ ingresos: 0, gastos: 0, diferencia: 0, fecha: hoy });
      }
    }, 60 * 1000); // Chequea cada minuto
    return () => clearInterval(interval);
  }, [resumenDiario]);

  useEffect(() => {
    if (!user || !datosCargados) return;
    guardarEstadoGestor({
      saldo,
      resumenDiario,
      clientes: people,
      uid: user.uid
    })
  }, [saldo, resumenDiario, people, user, datosCargados])




  const refresh = async () => {
    if (!user) return;
    // Traer el estado completo del gestor desde Firestore
    const estado = await db.obtenerEstadoGestor(user.uid)
    setSaldo(estado.saldo ?? 0)
    // Respetar la fecha del resumen diario
    const hoy = getTodayString();
    let resumen = estado.resumenDiario ?? { ingresos: 0, gastos: 0, diferencia: 0, fecha: hoy };
    if (!resumen.fecha || resumen.fecha !== hoy) {
      resumen = { ingresos: 0, gastos: 0, diferencia: 0, fecha: hoy };
    }
    setResumenDiario(resumen);
    setPeople(estado.clientes ?? [])
    setProducts(estado.products ?? [])
  }

  if (!user) {
    return (
      <div className="app" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f7f7fa'}}>
        <div style={{maxWidth:400,width:'100%',margin:'auto',padding:'32px 24px',background:'#fff',borderRadius:12,boxShadow:'0 2px 16px #0001'}}>
          <Auth onAuth={setUser} />
        </div>
      </div>
    )
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
            uid={user.uid}
          />
        )}
      </main>
    </div>
  )
}