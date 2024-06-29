import { getViConfig } from '../utils/config.js'
import { resolve } from 'path'
import { compileSFC } from '../utils/compiler.js'
import { removeExtname } from '../utils/shared.js'
import { getTransformResult } from '../utils/esbuild.js'
import { generateVueSfc, generateVueSfcTypes } from '../framework/vue3.js'
import { generateReactTsx, generateReactTsxTypes } from '../framework/react.js'
import { INDEX_FILE } from '../utils/constants.js'
import fse from 'fs-extra'
import logger from '../utils/logger.js'

export interface GenerateCommandOptions {
  entry?: string
  resolverNamespace?: string
  wrapperComponentName?: string
  framework?: 'vue3' | 'react'
  componentsOnly?: boolean
  output?: {
    components?: string
    types?: string
    esm?: string
    cjs?: string
    resolver?: string
  }
}

export interface GenerateModuleOptions {
  entry: string
  output: string
  format: 'cjs' | 'esm'
  framework: 'vue3' | 'react'
}

export interface GenerateResolverOptions {
  resolverNamespace: string
  output: string
  format: 'cjs' | 'esm'
}

export async function normalizeConfig(options: GenerateCommandOptions = {}) {
  const config = (await getViConfig()) ?? {}
  const entry = options.entry ?? config?.generate?.entry ?? './svg'
  const wrapperComponentName = options.wrapperComponentName ?? config?.generate?.wrapperComponentName ?? 'XIcon'
  const framework = options.framework ?? config?.generate?.framework ?? 'vue3'
  const resolverNamespace = options.resolverNamespace ?? config?.generate?.resolverNamespace ?? 'x'
  const componentsDir = resolve(
    process.cwd(),
    options.output?.components ?? config.generate?.output?.component ?? './svg-components',
  )
  const esmDir = resolve(process.cwd(), options.output?.esm ?? config.generate?.output?.esm ?? './svg-esm')
  const cjsDir = resolve(process.cwd(), options.output?.cjs ?? config.generate?.output?.cjs ?? './svg-cjs')
  const typesDir = resolve(process.cwd(), options.output?.types ?? config.generate?.output?.types ?? './svg-types')
  const resolverDir = resolve(
    process.cwd(),
    options.output?.resolver ?? config.generate?.output?.resolver ?? './resolver',
  )
  const componentsOnly = options.componentsOnly ?? config.generate?.componentsOnly ?? false

  return {
    entry,
    framework,
    resolverNamespace,
    wrapperComponentName,
    componentsDir,
    resolverDir,
    componentsOnly,
    esmDir,
    cjsDir,
    typesDir,
  }
}

export async function generate(options: GenerateCommandOptions = {}) {
  const {
    framework,
    entry,
    cjsDir,
    esmDir,
    componentsDir,
    typesDir,
    resolverDir,
    wrapperComponentName,
    resolverNamespace,
    componentsOnly,
  } = await normalizeConfig(options)

  if (framework === 'vue3') {
    generateVueSfc(entry, componentsDir, wrapperComponentName)
  }

  if (framework === 'react') {
    generateReactTsx(entry, componentsDir, wrapperComponentName)
  }

  generateIndexFile(componentsDir)

  if (!componentsOnly) {
    fse.removeSync(resolverDir)
    generateResolverTypes(resolverDir)

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
      generateResolver({
        output: resolverDir,
        resolverNamespace,
        format: 'esm',
      }),
      generateResolver({
        output: resolverDir,
        resolverNamespace,
        format: 'cjs',
      }),
      (framework === 'vue3' ? generateVueSfcTypes : generateReactTsxTypes)({
        entry: componentsDir,
        output: typesDir,
        wrapperComponentName,
      }),
    ])
  }

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
        content,
        loader: framework === 'vue3' ? 'ts' : 'tsx',
        format,
      }).then(({ code }) => ({
        code,
        filename: filename.replace(/\.tsx?$/, outputExtname).replace(/\.vue$/, outputExtname),
      }))
    }),
  )

  manifest.forEach(({ code, filename }) => {
    fse.outputFileSync(resolve(output, filename), code)
  })
}

export function generateIndexFile(dir: string) {
  const filenames = fse.readdirSync(dir)
  const content = filenames
    .map((filename) => `export { default as ${removeExtname(filename)} } from './${filename.replace(/\.tsx?$/, '')}'`)
    .join('\n')

  fse.outputFileSync(resolve(dir, INDEX_FILE), content)
}

export async function generateResolver({ resolverNamespace, output, format }: GenerateResolverOptions) {
  const packageName = fse.readJSONSync(resolve(process.cwd(), 'package.json')).name
  const content = `
const kebabCase = (s) => {
  const ret = s.replace(/([A-Z])/g, ' $1').trim()
  return ret.split(' ').join('-').toLowerCase()
}

export default function resolver() {
  return [
    {
      type: 'component',
      resolve: (name: string) => {
        const kebabCaseName = kebabCase(name)
        if (kebabCaseName.startsWith('${resolverNamespace}')) {
          return {
            from: '${packageName}',
            name: name.slice(${resolverNamespace.length}),
          }
        }
      },
    },
  ]
}`

  const { code } = await getTransformResult({
    loader: 'ts',
    content,
    format,
  })

  fse.outputFileSync(resolve(output, `index${getOutputExtname(format)}`), code)
}

export function generateResolverTypes(output: string) {
  const content = `export default function resolver(): { from: string; name: string }[]`
  fse.outputFileSync(resolve(output, 'index.d.ts'), content)
}
