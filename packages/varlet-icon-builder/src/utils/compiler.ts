import { compileScript as compileScriptSFC, compileTemplate, parse as parseSFC, registerTS } from '@vue/compiler-sfc'
import fse from 'fs-extra'
import hash from 'hash-sum'
import ts from 'typescript'

registerTS(() => ts)

const EXPORT = 'export default'
const SFC = '__sfc__'
const SFC_DECLARE = `const ${SFC} = `
const RENDER = '__render__'

export function declareEmptySFC() {
  return `${SFC_DECLARE}{}\n`
}

export function replaceExportToDeclare(script: string) {
  return script.replace(EXPORT, SFC_DECLARE)
}

export function injectExport(script: string) {
  script += `\n${EXPORT} ${SFC}`

  return script
}

export function injectScopeId(script: string, scopeId: string) {
  script += `\n${SFC}.__scopeId = '${scopeId}'`

  return script
}

export function injectRender(script: string, render: string): string {
  script = script.trim()
  render = render.replace('export function render', `function ${RENDER}`)
  script = script.replace(SFC_DECLARE, `${render}\n${SFC_DECLARE}`)
  script += `\n${SFC}.render = ${RENDER}`

  return script
}

export function compileSFC(file: string) {
  const sources = fse.readFileSync(file, 'utf-8')
  const id = hash(sources)
  const { descriptor } = parseSFC(sources, { filename: file, sourceMap: false })
  const { script, scriptSetup, template, styles } = descriptor

  let scriptContent
  let bindingMetadata

  if (script || scriptSetup) {
    if (scriptSetup) {
      const { content, bindings } = compileScriptSFC(descriptor, {
        id,
      })
      scriptContent = content
      bindingMetadata = bindings
    } else {
      // script only
      scriptContent = script!.content
    }

    scriptContent = replaceExportToDeclare(scriptContent)
  }

  if (!scriptContent) {
    scriptContent = declareEmptySFC()
  }

  // scoped
  const hasScope = styles.some((style) => style.scoped)
  const scopeId = hasScope ? `data-v-${id}` : ''

  if (template) {
    const render = compileTemplate({
      id,
      source: template.content,
      filename: file,
      compilerOptions: {
        expressionPlugins: descriptor.script?.lang === 'ts' ? ['typescript'] : undefined,
        scopeId,
        bindingMetadata,
      },
    }).code

    scriptContent = injectRender(scriptContent, render)
  }

  if (scopeId) {
    scriptContent = injectScopeId(scriptContent, scopeId)
  }

  scriptContent = injectExport(scriptContent)

  return scriptContent
}
