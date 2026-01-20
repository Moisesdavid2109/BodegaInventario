# Bodega Lista

Proyecto React mínimo para un catálogo y gestor de cuentas (deudas).

Características:
- Catálogo de productos (añadir, ver)
- Gestor de cuentas: registrar personas y anotar deudas por producto o monto
- Persistencia por defecto en `localStorage`
-- Persistencia por defecto en `localStorage` (sin integración en la nube por defecto)

Instalación y ejecución:

```bash
npm install
npm run dev
```

El proyecto funciona en modo local utilizando `localStorage`. Si en el futuro quieres añadir sincronización en la nube, puedo preparar una integración nueva y segura.

Siguientes pasos recomendados:
- Implementar autenticación si quieres varios usuarios
- Migrar los métodos de `src/lib/db.js` a llamadas reales a Firestore
- Añadir validación y edición/eliminación de registros

Si quieres, continuo y conecto `src/lib/db.js` a Firestore directamente y pruebo la integración.
