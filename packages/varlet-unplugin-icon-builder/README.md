## Intro

`@varlet/unplugin-icon-builder` is the [unplugin](https://github.com/unjs/unplugin) wrapper of `@varlet/icon-builder`

## Installation

### npm

```shell
npm i @varlet/unplugin-icon-builder -D
```

### yarn

```shell
yarn add @varlet/unplugin-icon-builder -D
```

### pnpm

```shell
pnpm add @varlet/unplugin-icon-builder -D
```

## Usage

### Example

The project file directory is as follows.

```
|-- project
  |-- src
    |-- main.ts
  |-- svg-icons
    |-- account-circle.svg
```

```ts
// main.ts
import 'virtual-icons'
```

```html
<i class="i i-account-circle"></i>
```

#### Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import icon from '@varlet/unplugin-icon-builder/vite'

export default defineConfig({
  plugins: [
    icon({
      // See the type definition below for configuration
    }),
  ],
})
```

#### Webpack Configuration

```ts
// vite.config.ts
const Icon = require('@varlet/unplugin-icon-builder/webpack')

module.exports = {
  plugins: [
    Icon.default({ 
      // See the type definition below for configuration
    })
  ],
}
```

#### Vue Cli Configuration

```ts
// vite.config.ts
const { defineConfig } = require('@vue/cli-service')
const Icon = require('@varlet/unplugin-icon-builder/webpack')

module.exports = defineConfig({
  transpileDependencies: true,

  configureWebpack: {
    plugins: [
      Icon.default({ 
        // See the type definition below for configuration
      })
    ],
  },
})
```

## Options Type Declaration

```ts
export interface Options {
  /**
   * @default `i-icons`
   * font name.
   */
  name?: string
  /**
   * @default `i`
   * font name prefix.
   */
  namespace?: string
  /**
   * @default `svg-icons`
   * svg directory.
   */
  dir?: string
  /**
   * svg library, it can be understood as dir in node_modules, 'lib' priority is greater than dir.
   */
  lib?: string
  /**
   * @default `virtual-icons`
   * virtual module id.
   */
  moduleId?: string
  /**
   * @default `virtual.icons.css`
   * font css file name generated based on svg. it can also be a path, which must end with .css.
   */
  generatedFilename?: string
  /**
   * icon font family class name, defaults same as `options.namespace`.
   */
  fontFamilyClassName?: string
  /**
   * @default `false`
   * on demand options.
   */
  onDemand: boolean | {
    /**
     * @default `['./src/**/*.{vue,jsx,tsx,js,ts}']`
     * files to watch for changes, node_modules will always be ignored.
     */
    include?: string[]
    /**
     * @default `['./src/**/*.{vue,jsx,tsx,js,ts}']`
     * files to exclude from watching.
     */
    exclude?: string[] 
  }
}
```
