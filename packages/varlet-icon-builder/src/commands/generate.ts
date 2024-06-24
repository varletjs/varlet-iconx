import { getViConfig } from '../utils/config.js'
import { resolve } from 'path'
import { compileSFC } from '../utils/compiler.js'
import { removeExtname } from '../utils/shared.js'
import { getTransformResult } from '../utils/esbuild.js'
import { generateVueSfc } from '../framework/vue3.js'
import { generateReactTsx } from '../framework/react.js'
import fse from 'fs-extra'
import logger from '../utils/logger.js'

export interface GenerateCommandOptions {
  entry?: string
  wrapperComponentName?: string
  framework?: 'vue3' | 'react'
  output?: {
    components?: string
    types?: string
    esm?: string
    cjs?: string
  }
}

export interface GenerateModuleOptions {
  entry: string
  output: string
  format: 'cjs' | 'esm'
  framework: 'vue3' | 'react'
}

const INDEX_FILE = 'index.ts'
const INDEX_D_FILE = 'index.d.ts'

export async function normalizeConfig(options: GenerateCommandOptions = {}) {
  const config = (await getViConfig()) ?? {}
  const entry = options.entry ?? config?.generate?.entry ?? './svg'
  const wrapperComponentName = options.wrapperComponentName ?? config?.generate?.wrapperComponentName ?? 'XIcon'
  const framework = options.framework ?? config?.generate?.framework ?? 'vue3'
  const componentsDir = resolve(
    process.cwd(),
    options.output?.components ?? config.generate?.output?.component ?? './svg-components',
  )
  const esmDir = resolve(process.cwd(), options.output?.esm ?? config.generate?.output?.esm ?? './svg-esm')
  const cjsDir = resolve(process.cwd(), options.output?.cjs ?? config.generate?.output?.cjs ?? './svg-cjs')
  const typesDir = resolve(process.cwd(), options.output?.types ?? config.generate?.output?.types ?? './svg-types')

  return {
    entry,
    framework,
    wrapperComponentName,
    componentsDir,
    esmDir,
    cjsDir,
    typesDir,
  }
}

export async function generate(options: GenerateCommandOptions = {}) {
  const { framework, entry, cjsDir, esmDir, componentsDir, typesDir, wrapperComponentName } =
    await normalizeConfig(options)

  if (framework === 'vue3') {
    generateVueSfc(entry, componentsDir, wrapperComponentName)
  }

  if (framework === 'react') {
    generateReactTsx(entry, componentsDir, wrapperComponentName)
  }

  generateIndexFile(componentsDir)

  await Promise.all([
    generateModule({
      entry: componentsDir,
      output: esmDir,
      format: 'esm',
      framework,
    }),
    generateModule({
      entry: componentsDir,
      output: cjsDir,
      format: 'cjs',
      framework,
    }),
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

export async function generateModule(options: GenerateModuleOptions) {
  const { output, format, entry, framework } = options

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

      return getTransformResult({
        filename,
        content,
        loader: framework === 'vue3' ? 'ts' : 'tsx',
        format,
        outputExtname,
      })
    }),
  )

  manifest.forEach(({ code, filename }) => {
    fse.outputFileSync(resolve(output, filename), code)
  })
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
