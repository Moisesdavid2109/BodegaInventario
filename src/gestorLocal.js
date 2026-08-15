// Capa de datos local: todo se guarda en este dispositivo (localStorage)
const ESTADO_KEY = 'bodegalista_estado';

function estadoVacio() {
  return {
    saldo: 0,
    resumenDiario: { ingresos: 0, gastos: 0, diferencia: 0, fecha: new Date().toISOString().slice(0, 10) },
    clientes: [],
    products: [],
    gastos: [],
  };
}

function normalizarEstado(data) {
  if (!data || typeof data !== 'object') return estadoVacio();
  if (!Array.isArray(data.clientes)) data.clientes = [];
  if (!Array.isArray(data.products)) data.products = [];
  if (!Array.isArray(data.gastos)) data.gastos = [];
  if (typeof data.saldo !== 'number') data.saldo = 0;
  if (typeof data.resumenDiario !== 'object' || !data.resumenDiario) {
    data.resumenDiario = { ingresos: 0, gastos: 0, diferencia: 0, fecha: new Date().toISOString().slice(0, 10) };
  }
  if (!data.resumenDiario.fecha) data.resumenDiario.fecha = new Date().toISOString().slice(0, 10);
  return data;
}

export async function obtenerEstadoGestor() {
  try {
    const raw = localStorage.getItem(ESTADO_KEY);
    if (raw) {
      return normalizarEstado(JSON.parse(raw));
    }
  } catch (e) {
    // ignorar: devuelve el estado vacío
  }
  return estadoVacio();
}

export async function guardarEstadoGestor(estado) {
  const prev = await obtenerEstadoGestor();
  const nuevo = normalizarEstado({ ...prev, ...estado });
  try {
    localStorage.setItem(ESTADO_KEY, JSON.stringify(nuevo));
  } catch (e) {
    // almacenamiento no disponible o lleno
  }
  return nuevo;
}
