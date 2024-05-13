import { defineConfig } from 'vite'
import icon from '@varlet/unplugin-icon-builder/vite'

export default defineConfig({
  plugins: [icon()],
})
