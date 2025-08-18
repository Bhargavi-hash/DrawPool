// client/vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // proxy WebSocket & API requests during dev to backend on port 1234
    proxy: {
      // this proxies /ws/* to ws://localhost:1234
      '/ws': {
        target: 'ws://localhost:1234',
        ws: true
      },
      // optional REST proxy example
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
