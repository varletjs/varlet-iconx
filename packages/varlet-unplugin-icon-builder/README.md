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

### Take vite as an example

The project file directory is as follows.

```
|-- project
  |-- src
    |-- main.ts  
  |-- svg-icons
    |-- account-circle.svg
  |-- index.html
  |-- vite.config.ts
```

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

```ts
// main.ts
import 'virtual:icons'
```

```html
<i class="i-icons i-account-circle"></i>
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
   * @default `virtual:icons`
   * virtual module id.
   */
  moduleId?: string
  /**
   * @default `virtual.icons.css`
   * font css file name generated based on svg.
   */
  generatedFilename?: string
  /**
   * icon font family class name, defaults same as `options.namespace`.
   */
  fontFamilyClassName?: string
}
```
