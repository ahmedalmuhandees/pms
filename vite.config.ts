import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { templateCompilerOptions } from '@tresjs/core'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev proxy always hits local API so LAN IP changes don't hang login.
  const apiTarget =
    env.VITE_API_PROXY_TARGET ||
    (mode === 'development' ? 'http://127.0.0.1:5216' : env.VITE_API_BASE_URL) ||
    'https://pmsaas-api.execute-iq.com'

  return {
    plugins: [
      vue({
        ...templateCompilerOptions,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
