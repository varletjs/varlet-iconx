import { defineConfig } from './dist/index.js'

export default defineConfig({
  name: 'i-icons',
  namespace: 'i',
  fontFamilyClassName: 'i--set',
  entry: './svg-icons',
  output: './icons',
})
