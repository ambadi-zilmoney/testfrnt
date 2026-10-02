import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Security headers (CSP, HSTS, ...) are set by CloudFront - see infra/frontend-stack.yaml.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    build: {
      sourcemap: false,
    },
    server: {
      port: 5173,
      // Dev only: /api is proxied straight to a Docker API replica (backend-a)
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:8081',
          changeOrigin: true,
        },
      },
    },
  }
})
