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

### Using Command

```shell
npx vi build

# watch mode
npx vi build -w
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
     * @default `./svg-icons`
     * output path
     */
    output?: string
  }
}
```
