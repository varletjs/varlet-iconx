import icon from '@varlet/unplugin-icon-builder/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), icon({ lib: '@varlet/test-icons/svg-icons', onDemand: true })],
})
