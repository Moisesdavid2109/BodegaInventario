import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function fechaLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Perfiles ───
export async function crearPerfil(nombre, pin) {
  return addDoc(collection(db, 'perfiles'), {
    nombre,
    pin,
    createdAt: serverTimestamp(),
    activo: true,
  });
}

export async function obtenerPerfiles() {
  const snap = await getDocs(query(collection(db, 'perfiles'), where('activo', '==', true)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function actualizarPerfil(id, data) {
  return updateDoc(doc(db, 'perfiles', id), data);
}

async function borrarDocsDe(coleccion, campo, valor) {
  const snap = await getDocs(query(collection(db, coleccion), where(campo, '==', valor)));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

export async function borrarCuenta(perfilId) {
  const colecciones = [
    ['perfil_precios', 'perfilId'],
    ['perfil_stock', 'perfilId'],
    ['transacciones_banco', 'perfilId'],
    ['fiados', 'perfilId'],
    ['pedidos', 'perfilId'],
    ['clientes', 'perfilId'],
    ['control_general', 'perfilId'],
    ['cajas', 'perfilId'],
    ['movimientos_caja', 'perfilId'],
  ];
  await Promise.all(colecciones.map(([c, campo]) => borrarDocsDe(c, campo, perfilId)));
  await deleteDoc(doc(db, 'perfiles', perfilId));
}

// ─── Productos (CATÁLOGO COMPARTIDO — sin perfilId) ───
function limpiarObj(obj) {
  const limpio = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) limpio[k] = v;
  }
  return limpio;
}

export async function sembrarProductos(productos) {
  for (const p of productos) {
    const docRef = await addDoc(collection(db, 'productos'), { ...limpiarObj(p), createdAt: serverTimestamp() });
    await updateDoc(docRef, { id: docRef.id });
  }
}

export async function agregarProducto(prod) {
  const docRef = await addDoc(collection(db, 'productos'), { ...limpiarObj(prod), createdAt: serverTimestamp() });
  await updateDoc(docRef, { id: docRef.id });
  return docRef;
}

export async function migrarProductosIds() {
  const snap = await getDocs(collection(db, 'productos'));
  const updates = [];
  for (const d of snap.docs) {
    const data = d.data();
    if (data.id !== d.id) {
      updates.push({ oldId: data.id, newId: d.id, ref: d.ref });
      await updateDoc(d.ref, { id: d.id });
    }
  }
  if (updates.length > 0) {
    const preciosSnap = await getDocs(collection(db, 'perfil_precios'));
    for (const pd of preciosSnap.docs) {
      const pData = pd.data();
      const match = updates.find(u => u.oldId === pData.productId);
      if (match) {
        await updateDoc(pd.ref, { productId: match.newId });
      }
    }
  }
}

export async function actualizarProducto(id, data) {
  return updateDoc(doc(db, 'productos', id), limpiarObj(data));
}

export async function eliminarProducto(id) {
  return deleteDoc(doc(db, 'productos', id));
}

export function escucharProductos(callback) {
  return onSnapshot(collection(db, 'productos'), (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  });
}

// ─── Precios por perfil (perfilId + productId → price, costPrice) ───
export function escucharPrecios(perfilId, callback) {
  const q = query(collection(db, 'perfil_precios'), where('perfilId', '==', perfilId));
  return onSnapshot(q, (snap) => {
    const mapa = {};
    snap.docs.forEach(d => {
      const data = d.data();
      mapa[data.productId] = { price: data.price, costPrice: data.costPrice, docId: d.id };
    });
    callback(mapa);
  });
}

export async function guardarPrecio(perfilId, productId, price, costPrice) {
  const q = query(
    collection(db, 'perfil_precios'),
    where('perfilId', '==', perfilId),
    where('productId', '==', productId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return updateDoc(snap.docs[0].ref, { price, costPrice });
  }
  return addDoc(collection(db, 'perfil_precios'), {
    perfilId, productId, price, costPrice, createdAt: serverTimestamp(),
  });
}

export async function sembrarPrecios(perfilId, productos) {
  for (const p of productos) {
    const q = query(
      collection(db, 'perfil_precios'),
      where('perfilId', '==', perfilId),
      where('productId', '==', p.id)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      await addDoc(collection(db, 'perfil_precios'), {
        perfilId, productId: p.id, price: p.price, costPrice: p.costPrice,
        createdAt: serverTimestamp(),
      });
    }
  }
}

// ─── Stock por perfil (perfilId + productId → stock) ───
export function escucharStock(perfilId, callback) {
  const q = query(collection(db, 'perfil_stock'), where('perfilId', '==', perfilId));
  return onSnapshot(q, (snap) => {
    const mapa = {};
    snap.docs.forEach(d => {
      mapa[d.data().productId] = Number(d.data().stock) || 0;
    });
    callback(mapa);
  });
}

export async function guardarStock(perfilId, productId, stock) {
  const q = query(
    collection(db, 'perfil_stock'),
    where('perfilId', '==', perfilId),
    where('productId', '==', productId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return updateDoc(snap.docs[0].ref, { stock });
  }
  return addDoc(collection(db, 'perfil_stock'), {
    perfilId, productId, stock, createdAt: serverTimestamp(),
  });
}

// ─── Caja ───
export async function abrirCaja(perfilId, saldoInicial) {
  const hoy = new Date().toISOString().slice(0, 10);
  const existentes = await getDocs(
    query(collection(db, 'cajas'), where('perfilId', '==', perfilId), where('fecha', '==', hoy))
  );
  if (!existentes.empty) throw new Error('Ya hay una caja abierta para hoy');
  return addDoc(collection(db, 'cajas'), {
    ...limpiarObj({ perfilId, fecha: hoy, saldoInicial,
    saldoFinal: null, estado: 'abierta' }),
    createdAt: serverTimestamp(), closedAt: null,
  });
}

export async function cerrarCaja(cajaId, saldoFinal) {
  return updateDoc(doc(db, 'cajas', cajaId), {
    saldoFinal, estado: 'cerrada', closedAt: serverTimestamp(),
  });
}

export function escucharCajaDelDia(perfilId, callback) {
  const hoy = new Date().toISOString().slice(0, 10);
  const q = query(collection(db, 'cajas'), where('perfilId', '==', perfilId), where('fecha', '==', hoy));
  return onSnapshot(q, (snap) => {
    callback(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
  });
}

// ─── Movimientos de Caja ───
export async function agregarMovimientoCaja(perfilId, cajaId, data) {
  return addDoc(collection(db, 'movimientos_caja'), {
    ...limpiarObj({ perfilId, cajaId, ...data }), createdAt: serverTimestamp(),
  });
}

export function escucharMovimientosCaja(cajaId, callback) {
  const q = query(collection(db, 'movimientos_caja'), where('cajaId', '==', cajaId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
    callback(items);
  });
}

export async function eliminarMovimientoCaja(id) {
  return deleteDoc(doc(db, 'movimientos_caja', id));
}

// ─── Transacciones Banco ───
export async function agregarTransaccionBanco(perfilId, data) {
  const docRef = await addDoc(collection(db, 'transacciones_banco'), {
    ...limpiarObj({ perfilId, ...data }), createdAt: serverTimestamp(),
  });
  return docRef;
}

export function escucharTransaccionesBanco(perfilId, callback) {
  const q = query(collection(db, 'transacciones_banco'), where('perfilId', '==', perfilId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
    callback(items);
  });
}

export async function eliminarTransaccionBanco(id) {
  return deleteDoc(doc(db, 'transacciones_banco', id));
}

// ─── Fiados ───
export async function agregarFiado(perfilId, data) {
  return addDoc(collection(db, 'fiados'), {
    ...limpiarObj({ perfilId, ...data }), createdAt: serverTimestamp(),
  });
}

export function escucharFiados(perfilId, callback) {
  const q = query(collection(db, 'fiados'), where('perfilId', '==', perfilId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
    callback(items);
  });
}

export async function actualizarFiado(id, data) {
  return updateDoc(doc(db, 'fiados', id), limpiarObj(data));
}

export async function registrarPagoFiado(fiadoId, pago) {
  const fiadoRef = doc(db, 'fiados', fiadoId);
  const fiadoSnap = await getDoc(fiadoRef);
  if (!fiadoSnap.exists()) return;
  const fiadoData = fiadoSnap.data();
  const nuevosPagos = [...(fiadoData.pagos || []), pago];
  const nuevoMontoPagado = (fiadoData.montoPagado || 0) + pago.monto;
  const nuevoEstado = nuevoMontoPagado >= fiadoData.montoTotal ? 'pagado' : fiadoData.estado;
  return updateDoc(fiadoRef, {
    pagos: nuevosPagos, montoPagado: nuevoMontoPagado, estado: nuevoEstado,
  });
}

// ─── Pedidos (Historial) ───
export async function agregarPedido(perfilId, pedido) {
  return addDoc(collection(db, 'pedidos'), {
    ...limpiarObj({ perfilId, ...pedido }), createdAt: serverTimestamp(),
  });
}

export function escucharPedidos(perfilId, callback) {
  const q = query(collection(db, 'pedidos'), where('perfilId', '==', perfilId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
    callback(items);
  });
}

export async function eliminarPedido(id) {
  return deleteDoc(doc(db, 'pedidos', id));
}

// ─── Comprobantes (Storage) ───
async function comprimirImagen(base64, maxKB = 300) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 1200;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      let quality = 0.7;
      let result = canvas.toDataURL('image/jpeg', quality);
      while (result.length * 0.75 > maxKB * 1024 && quality > 0.15) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(result);
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export async function subirComprobante(perfilId, txnId, base64) {
  const comprimida = await comprimirImagen(base64);
  const storageRef = ref(storage, `comprobantes/${perfilId}/${txnId}.jpg`);
  await uploadString(storageRef, comprimida, 'data_url');
  return getDownloadURL(storageRef);
}

// ─── Clientes (para fiados) ───
export async function crearCliente(perfilId, data) {
  return addDoc(collection(db, 'clientes'), {
    ...limpiarObj({ perfilId, ...data }), createdAt: serverTimestamp(), activo: true,
  });
}

export function escucharClientes(perfilId, callback) {
  const q = query(collection(db, 'clientes'), where('perfilId', '==', perfilId), where('activo', '==', true));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  });
}

export async function eliminarCliente(id) {
  return updateDoc(doc(db, 'clientes', id), { activo: false });
}

// ─── Control General (Caja total) ───
export function escucharControlGeneral(perfilId, callback) {
  const q = query(collection(db, 'control_general'), where('perfilId', '==', perfilId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    callback(items);
  }, (err) => console.error('Error escuchando control general:', err));
}

export async function agregarMovimientoGeneral(perfilId, data) {
  return addDoc(collection(db, 'control_general'), {
    ...limpiarObj({ perfilId, fecha: data.fecha || fechaLocal(), ...data }),
    createdAt: serverTimestamp(),
  });
}

export async function eliminarMovimientoGeneral(id) {
  return deleteDoc(doc(db, 'control_general', id));
}
