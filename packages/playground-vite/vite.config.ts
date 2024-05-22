import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import icon from '@varlet/unplugin-icon-builder/vite'

export default defineConfig({
  plugins: [vue(), icon({ lib: '@varlet/test-icons/svg-icons', onDemand: true })],
})
