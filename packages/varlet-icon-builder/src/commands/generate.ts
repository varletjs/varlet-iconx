import { getViConfig } from '../utils/config.js'
import { resolve } from 'path'
import { bigCamelize } from '@varlet/shared'
import { compileSFC } from '../utils/compiler.js'
import { removeExtname } from '../utils/shared.js'
import esbuild from 'esbuild'
import fse from 'fs-extra'
import logger from '../utils/logger.js'

export interface GenerateCommandOptions {
  entry?: string
  wrapperComponentName?: string
  output?: {
    components?: string
    types?: string
    esm?: string
    cjs?: string
  }
}

const INDEX_FILE = 'index.ts'
const INDEX_D_FILE = 'index.d.ts'

export async function generate(options: GenerateCommandOptions = {}) {
  const config = (await getViConfig()) ?? {}
  const entry = options.entry ?? config?.generate?.entry ?? './svg'
  const wrapperComponentName = options.wrapperComponentName ?? config?.generate?.wrapperComponentName ?? 'XIcon'
  const componentsDir = resolve(
    process.cwd(),
    options.output?.components ?? config.generate?.output?.component ?? './svg-components',
  )
  const esmDir = resolve(process.cwd(), options.output?.esm ?? config.generate?.output?.esm ?? './svg-esm')
  const cjsDir = resolve(process.cwd(), options.output?.cjs ?? config.generate?.output?.cjs ?? './svg-cjs')
  const typesDir = resolve(process.cwd(), options.output?.types ?? config.generate?.output?.types ?? './svg-types')

  generateVueSfc(entry, componentsDir, wrapperComponentName)
  generateIndexFile(componentsDir)
  await Promise.all([
    generateModule(componentsDir, esmDir, 'esm'),
    generateModule(componentsDir, cjsDir, 'cjs'),
    generateTypes(componentsDir, typesDir, wrapperComponentName),
  ])
  logger.success('generate icons success')
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
      let content = filename.endsWith('.vue') ? compileSFC(file) : fse.readFileSync(file, 'utf-8')

      if (filename === INDEX_FILE) {
        content = content.replace(/\.vue/g, outputExtname)
      }

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

export function generateVueSfc(entry: string, output: string, wrapperComponentName: string) {
  fse.removeSync(output)

  const filenames = fse.readdirSync(entry)
  filenames.forEach((filename) => {
    const file = resolve(process.cwd(), entry, filename)
    const content = fse.readFileSync(file, 'utf-8')
    const sfcContent = compileSvgToVueSfc(filename.replace('.svg', ''), content)

    fse.outputFileSync(resolve(output, bigCamelize(filename.replace('.svg', '.vue'))), sfcContent)
  })

  fse.outputFileSync(
    resolve(output, 'XIcon.vue'),
    `\
<template>
  <i :style="style">
    <slot />
  </i>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: '${wrapperComponentName}',
  props: {
    size: {
      type: [String, Number],
      default: '1em',
    },
    color: {
      type: String,
      default: 'currentColor',
    }
  },
  setup(props) {
    const style = computed(() => ({
      display: 'inline-flex',
      color: props.color,
      '--x-icon-size': typeof props.size === 'number' ? \`\${props.size}px\` : props.size,
    }))

    return {
      style
    }
  }
})
</script>`,
  )
}

export function generateTypes(entry: string, output: string, wrapperComponentName: string) {
  fse.removeSync(output)
  const filenames = fse.readdirSync(entry).filter((filename) => filename !== INDEX_FILE)
  filenames.forEach((filename) => {
    if (filename === `${wrapperComponentName}.vue`) {
      fse.outputFileSync(
        resolve(output, `${wrapperComponentName}.d.ts`),
        `\
export default class ${wrapperComponentName} {
  static name: string
    
  $props: {
    size?: string | number
    color?: string
  }
}`,
      )
    } else {
      fse.outputFileSync(
        resolve(output, `${removeExtname(filename)}.d.ts`),
        `\
export default class ${removeExtname(filename)} {
  static name: string

  $props: {}
}`,
      )
    }
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
  if (!content.match(/fill=".+?"/g) && !content.match(/stroke=".+?"/g)) {
    return content.replace('<svg', '<svg fill="currentColor"')
  }

  return content
    .replace(/fill="(?!none).+?"/g, 'fill="currentColor"')
    .replace(/stroke="(?!none).+?"/g, 'stroke="currentColor"')
}

export function injectSvgStyle(content: string) {
  return content.replace('<svg', '<svg style="width: var(--x-icon-size); height: var(--x-icon-size)"')
}

export function compileSvgToVueSfc(name: string, content: string) {
  content = injectSvgStyle(injectSvgCurrentColor(content.match(/<svg (.|\n|\r)*/)?.[0] ?? ''))
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
