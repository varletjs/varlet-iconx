import { getViConfig } from '../utils/config.js'
import { resolve } from 'path'
import { bigCamelize } from '@varlet/shared'
import { compileSFC } from '../utils/compiler.js'
import { removeExtname } from '../utils/shared.js'
import esbuild from 'esbuild'
import fse from 'fs-extra'

export interface GenerateCommandOptions {
  entry?: string
  output?: {
    components?: string
    types?: string
    esm?: string
    cjs?: string
  }
}

const FILL_RE = /fill=".+?"/g
const STROKE_RE = /stroke=".+?"/g
const INDEX_FILE = 'index.ts'
const INDEX_D_FILE = 'index.d.ts'

export async function generate(options: GenerateCommandOptions = {}) {
  const config = (await getViConfig()) ?? {}
  const entry = options.entry ?? config?.generate?.entry ?? './svg'
  const componentsDir = resolve(
    process.cwd(),
    options.output?.components ?? config.generate?.output?.component ?? './svg-components',
  )
  const esmDir = resolve(process.cwd(), options.output?.esm ?? config.generate?.output?.esm ?? './svg-esm')
  const cjsDir = resolve(process.cwd(), options.output?.cjs ?? config.generate?.output?.cjs ?? './svg-cjs')
  const typesDir = resolve(process.cwd(), options.output?.types ?? config.generate?.output?.types ?? './svg-types')

  generateVueSfc(entry, componentsDir)
  generateIndexFile(componentsDir)
  await Promise.all([
    generateModule(componentsDir, esmDir, 'esm'),
    generateModule(componentsDir, cjsDir, 'cjs'),
    generateTypes(componentsDir, typesDir),
  ])
}

export function getOutputExtname(format: 'cjs' | 'esm') {
  const pkgJson = fse.readJsonSync(resolve(process.cwd(), 'package.json'))
  const isModule = pkgJson.type === 'module'

  if (isModule) {
    return format === 'esm' ? '.js' : '.cjs'
  }

  return format === 'esm' ? '.mjs' : '.js'
}

export async function generateModule(entry: string, output: string, format: 'cjs' | 'esm') {
  fse.removeSync(output)
  const outputExtname = getOutputExtname(format)
  const filenames = fse.readdirSync(entry)
  const manifest = await Promise.all(
    filenames.map((filename) => {
      const file = resolve(process.cwd(), entry, filename)
      const content = filename.endsWith('.vue') ? compileSFC(file) : fse.readFileSync(file)

      return esbuild
        .transform(content, {
          loader: 'ts',
          target: 'es2016',
          format,
        })
        .then(({ code }) => ({
            code,
            filename: filename.replace('.ts', outputExtname).replace('.vue', outputExtname),
          }))
    }),
  )

  manifest.forEach(({ code, filename }) => {
    fse.outputFileSync(resolve(output, filename), code)
  })
}

export function generateVueSfc(entry: string, output: string) {
  fse.removeSync(output)

  const filenames = fse.readdirSync(entry)
  filenames.forEach((filename) => {
    const file = resolve(process.cwd(), entry, filename)
    const content = fse.readFileSync(file, 'utf-8')
    const sfcContent = compileSvgToVueSfc(filename.replace('.svg', ''), content)

    fse.outputFileSync(resolve(output, bigCamelize(filename.replace('.svg', '.vue'))), sfcContent)
  })
}

export function generateTypes(entry: string, output: string) {
  fse.removeSync(output)
  const filenames = fse.readdirSync(entry).filter((filename) => filename !== INDEX_FILE)
  filenames.forEach((filename) => {
    const content = `\
export default class ${removeExtname(filename)} {
  static name: string

  $props: {}
}`

    fse.outputFileSync(resolve(output, `${removeExtname(filename)}.d.ts`), content)
  })

  const indexContent = filenames
    .map((filename) => `export { default as ${removeExtname(filename)} } from './${removeExtname(filename)}'`)
    .join('\n')

  fse.outputFileSync(resolve(output, INDEX_D_FILE), indexContent)
}

export function generateIndexFile(dir: string) {
  const filenames = fse.readdirSync(dir)
  const content = filenames
    .map(
      (filename) =>
        `export { default as ${removeExtname(filename)} } from './${
          filename.endsWith('.ts') ? filename.replace('.ts', '') : filename
        }'`,
    )
    .join('\n')

  fse.outputFileSync(resolve(dir, INDEX_FILE), content)
}

export function injectSvgCurrentColor(content: string) {
  if (!content.match(FILL_RE) && !content.match(STROKE_RE)) {
    return content.replace('<svg', '<svg fill="currentColor"')
  }

  return content.replace(FILL_RE, 'fill="currentColor"').replace(STROKE_RE, 'stroke="currentColor"')
}

export function compileSvgToVueSfc(name: string, content: string) {
  content = injectSvgCurrentColor(content.match(/<svg (.|\n|\r)*/)?.[0] ?? '')
  return `\
<template>
  ${content}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: '${bigCamelize(name)}',
})
</script>
`
}
