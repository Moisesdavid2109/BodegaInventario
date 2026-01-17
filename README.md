# Bodega Lista

Proyecto React mínimo para un catálogo y gestor de cuentas (deudas) con opción de usar Firebase Firestore.

Características:
- Catálogo de productos (añadir, ver)
- Gestor de cuentas: registrar personas y anotar deudas por producto o monto
- Persistencia por defecto en `localStorage`
- Plantilla para conectar con Firebase Firestore (ver `src/firebaseConfig.example.js`)

Instalación y ejecución:

```bash
npm install
npm run dev
```

Usar Firestore:
1. Crea un proyecto en Firebase y habilita Firestore.
2. Copia `src/firebaseConfig.example.js` a `src/firebaseConfig.js` y pega tu configuración.
3. Instala dependencias si no lo hiciste: `npm install`.
4. Conecta la lógica de `src/lib/db.js` con Firestore (hay un `src/firebase.js` con plantilla).

Siguientes pasos recomendados:
- Implementar autenticación si quieres varios usuarios
- Migrar los métodos de `src/lib/db.js` a llamadas reales a Firestore
- Añadir validación y edición/eliminación de registros

Si quieres, continuo y conecto `src/lib/db.js` a Firestore directamente y pruebo la integración.
