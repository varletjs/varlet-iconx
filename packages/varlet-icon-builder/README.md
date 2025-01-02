## Intro

`@varlet/icon-builder` is a tool to build svg images to icon fonts.

## Installation

### npm

```shell
npm i @varlet/icon-builder -D
```

### yarn

```shell
yarn add @varlet/icon-builder -D
```

### pnpm

```shell
pnpm add @varlet/icon-builder -D
```

## Usage

### Commands

#### build

Build svg into icon font.

```shell
npx vi build

# watch mode
npx vi build -w
```

#### generate

Generate components from svg, support esm, cjs, sfc, types.

```shell
npx vi generate
```

#### figma

Pull the svg icon in the figma document to the local.

```shell
npx vi figma -f <file> -t <token>
#or token from process.env
VI_FIGMA_TOKEN=<token> npx vi figma -f <file>
```

## Configuration File

```js
// vi.config.ts
import { defineConfig } from '@varlet/icon-builder'

export default defineConfig({
  name: 'i-icons',
  namespace: 'i',
  fontFamilyClassName: 'i--set',
  entry: './svg-icons',
  output: './icons',
  figma: {},
  generate: {}
})
```

## Configuration Type Declaration

```ts
export interface VIConfig {
  /**
   * @default `varlet-icons`
   * font name.
   */
  name?: string
  /**
   * @default `var-icon`
   * font name prefix.
   */
  namespace?: string
  /**
   * @default `true`
   * output base64
   */
  base64?: boolean
  /**
   * @default `./svg`
   * svg icons folder path.
   */
  entry?: string
  /**
   * @default `./dist`
   * svg icons folder path.
   */
  output?: string
  /**
   * @default `var-icon--set`
   * icon font family class name.
   */
  fontFamilyClassName?: string
  /**
   * @default `normal`
   * icon font weight.
   */
  fontWeight?: string
  /**
   * @default `normal`
   * icon font style.
   */
  fontStyle?: string
  /**
   * @default `false`
   * Whether to output files
   */
  emitFile?: boolean
  /**
   * icon font public path
   */
  publicPath?: string
   /**
   * icon font public url
   */
  publicURL?: string
  /**
   * icon filenames, e.g. ['window-close', 'cog']
   */
  filenames?: string[]
  /**
   * generate command related options
   */ 
  generate?: {
    /**
     * @default `./svg`
     * svg icons folder path
     */
    entry?: string
    /**
     * @default `XIcon`
     * wrapper component name, svg file names should avoid using names like x-icon.svg
     */
    wrapperComponentName?: string
    /**
     * @default `x`
     * unplugin-vue-components resolver namespace, please same as `wrapperComponentName` namespace
     */
    resolverNamespace?: string
    /**
     * @default `vue3`
     * frameworks supported by the icon library
     */
    framework?: 'vue3' | 'react'
    /**
     * @default `false`
     * only generate components, do not generate cjs, esm modules and types
     */
    componentsOnly?: boolean
    /**
     * @default () => false
     * is colorful icon
     */
    colorful?: (name: string, content: string) => boolean 
    output?: {
      /**
       * @default `./svg-components`
       * component output path
       */
      component?: string
      /**
       * @default `./svg-types`
       * ts declaration output path
       */
      types?: string
      /**
       * @default `./svg-esm`
       * es module format output path
       */
      esm?: string
      /**
       * @default `./svg-cjs`
       * commonjs module format output path
       */
      cjs?: string
      /**
       * @default `./resolver`
       * unplugin-vue-components resolver output path
       */
      resolver?: string
    }
  }
  /**
   * figma parsing options
   */
  figma?: {
    /**
     * figma token
     * @see https://www.figma.com/developers/api#authentication
     */
    token?: string
    /**
     * figma file id
     */
    file?: string
    /**
     * @default `Icons`
     * figma icons page name
     */
    pageName?: string
    /**
     * @default `false`
     * whether to skip downloading svg files when a file with the same name exists locally
     */
    skipExisting?: boolean
    /**
     * @default `false`
     * whether to clear the output directory before downloading
     */
    clean?: boolean
    /**
     * @default `./svg-figma`
     * output path
     */
    output?: string
  }
}
```
