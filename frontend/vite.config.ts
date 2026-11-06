import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// O navegador chama caminhos relativos (/api/...). O proxy encaminha para a API Java
// sem remover o prefixo /api (sem "rewrite") e sem alterar o cabeçalho Host.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:8083',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/configuracao.ts'],
  },
})
