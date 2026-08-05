import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 部署在子路径下（如 /credit-card-ledger/），需要设置 base。
  // 本地开发时默认 '/'，构建时通过 VITE_BASE_PATH 环境变量动态设置。
  base: process.env.VITE_BASE_PATH || '/',
})
