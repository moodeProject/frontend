import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 백엔드(CorsConfig)가 http://localhost:3000 에서의 요청만 허용하므로 포트를 맞춰줍니다.
    port: 3000,
  },
})
