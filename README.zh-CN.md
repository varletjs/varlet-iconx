<h1 align="center">Varlet Icon Builder</h1>

<p align="center">
  <a href="https://github.com/varletjs/varlet-icon-builder/blob/main/README.md"> English </a> | 
  <span>中文</span>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@varlet/icon-builder" target="_blank" rel="noopener noreferrer"><img src="https://badgen.net/npm/v/@varlet/icon-builder" alt="NPM Version" /></a>
  <a href="https://github.com/varletjs/icon-builder/blob/main/LICENCE" target="_blank" rel="noopener noreferrer"><img src="https://badgen.net/github/license/varletjs/varlet-icon-builder" alt="License" /></a>
</p>

## 介绍

`Varlet Icon Builder` 可以将 svg 图标转换成字体图标

## 安装

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

## 使用方法

### 配置文件

```js
// vi.config.mjs
import { defineConfig } from '@varlet/icon-builder'

export default defineConfig({
  name: 'i-icons',
  namespace: 'i',
  fontFamilyClassName: 'i--set',
  entry: './svg-icons',
  output: './icons',
})
```

### 运行命令

```shell
npx vi build

# watch mode
npx vi build -w
```

## 配置文件类型定义

```ts
export interface VIConfig {
  /**
   * @default `varlet-icons`
   * Font name.
   */
  name?: string
  /**
   * @default `var-icon`
   * Font name prefix.
   */
  namespace?: string
  /**
   * @default `true`
   * Output base64
   */
  base64?: boolean
  /**
   * @default `./svg`
   * SVG icons folder path.
   */
  entry?: string
  /**
   * @default `./dist`
   * SVG icons folder path.
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
  publicPath?: string
}
```
