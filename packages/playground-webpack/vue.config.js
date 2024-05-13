const { defineConfig } = require('@vue/cli-service')
const Icon = require('@varlet/unplugin-icon-builder/webpack')

module.exports = defineConfig({
  transpileDependencies: true,

  configureWebpack: {
    plugins: [Icon.default()],
  },
})
