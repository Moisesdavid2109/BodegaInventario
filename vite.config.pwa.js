import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default {
  // ...otros ajustes de Vite
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'StrataStock',
        short_name: 'StrataStock',
        start_url: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f3f6ff',
        theme_color: '#2563eb',
        description: 'Control de ventas, compras, caja, digital y fiado para tu negocio.',
        lang: 'es',
        categories: ['business', 'shopping', 'finance'],
        icons: [
          {
            src: 'src/assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'src/assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'src/assets/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'src/assets/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
};
