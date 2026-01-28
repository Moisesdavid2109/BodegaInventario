import { VitePWA } from 'vite-plugin-pwa';

export default {
  // ...otros ajustes de Vite
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Bodega Lista',
        short_name: 'Bodega',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1976d2',
        description: 'Gestor de productos y cuentas para tu bodega.',
        icons: [
          {
            src: 'src/assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'src/assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        orientation: 'portrait'
      }
    })
  ]
};
