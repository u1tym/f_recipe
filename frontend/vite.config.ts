import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // API は別プロセス（ユーザー指定）なので、フロント側はデフォルトのまま
    port: 5173,
    strictPort: true,
    proxy: {
      // CORS回避用: settings/api.ts 側を VITE_API_BASE_URL=/api にすると使えます。
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

