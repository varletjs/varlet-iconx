import { defineConfig } from '@varlet/icon-builder'

export default defineConfig({
  name: 'i-icons',
  namespace: 'i',
  fontFamilyClassName: 'i--set',
  entry: './svg-icons',
  output: './icons-123',
})
