# StrataStock

Gestor de negocio: ventas, compras, caja, digital (bancos), fiados e historial.

Características:
- Catálogo de productos (añadir, ver, editar)
- Ventas y compras con control de stock
- Caja del día (ingresos y gastos en físico)
- Digital: transferencias y tarjetas en bolívares (Bs)
- Fiados: registrar personas y anotar deudas con pagos
- Historial de pedidos y copia de seguridad (exportar/importar)
- Tasas de cambio en vivo (USD/VES, COP/USD, EUR/VES) con respaldo offline

Instalación y ejecución:

```bash
npm install
npm run dev
```

Los datos se sincronizan mediante Firebase (Firestore). La app funciona como PWA instalable.