import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { buildIcons } from '@varlet/icon-builder'
import { isAbsolute, resolve } from 'path'
import { debounce, isPlainObject, uniq } from '@varlet/shared'
import glob from 'fast-glob'
import fse from 'fs-extra'
import chokidar from 'chokidar'

export function resolvePath(path: string) {
  return isAbsolute(path) ? path : resolve(process.cwd(), path)
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options: Options = {}) => {
  const {
    moduleId = 'virtual-icons',
    generatedFilename = 'virtual.icons.css',
    name = 'i-icons',
    dir = './svg-icons',
    namespace = 'i',
    fontFamilyClassName,
    onDemand = false,
  } = options

  const generatedFileId = resolvePath(generatedFilename)
  const dirId = resolvePath(dir)
  const graph = new Map<string, string[]>()
  const tokens: string[] = []
  const writeVirtualIconFileWithDebounce = debounce(writeVirtualIconFile, 200)
  const initOnDemandWithDebounce = debounce(initOnDemand, 200)

  initOnDemand()

  if (process.env.NODE_ENV === 'development') {
    chokidar.watch(dirId, { ignoreInitial: true }).on('all', () => {
      initOnDemandWithDebounce()
      writeVirtualIconFileWithDebounce()
    })

    if (onDemand) {
      const { include, exclude } = getOnDemandFilter()
      chokidar.watch(include, { ignoreInitial: true, ignored: exclude }).on('all', (eventName, path) => {
        updateGraphNode(eventName, path)
        writeVirtualIconFileWithDebounce()
      })
    }
  }

  function getOnDemandFilter() {
    const defaultInclude = ['./src/**/*.{vue,jsx,tsx,js,ts}']
    const internalInclude = ['node_modules', generatedFileId]
    const include = isPlainObject(onDemand) ? onDemand.include ?? defaultInclude : defaultInclude
    const exclude = isPlainObject(onDemand) ? [...internalInclude, ...(onDemand.exclude ?? [])] : internalInclude

    return {
      include,
      exclude,
    }
  }

  function initOnDemand() {
    if (onDemand) {
      updateTokens()
      updateGraph()
    }
  }

  function updateGraph() {
    const { include, exclude } = getOnDemandFilter()
    glob.sync(include, { ignore: exclude }).forEach((path) => {
      updateGraphNode('add', path)
    })
  }

  function updateGraphNode(eventName: string, path: string) {
    if (eventName === 'add' || eventName === 'change') {
      const content = fse.readFileSync(path, 'utf-8')
      const existedTokens = tokens.filter((token) => content.includes(token))

      if (existedTokens.length > 0) {
        graph.set(path, existedTokens)
      } else {
        graph.delete(path)
      }
    }

    if (eventName === 'unlink') {
      graph.delete(path)
    }
  }

  function updateTokens() {
    tokens.length = 0

    if (!fse.existsSync(dirId)) {
      return
    }

    const files = fse.readdirSync(dirId)
    const svgTokens = files.filter((file) => file.endsWith('.svg')).map((file) => file.replace(/\.svg$/, ''))
    tokens.push(...svgTokens)
  }

  function getMatcher() {
    const tokens: string[] = []
    graph.forEach((value) => {
      tokens.push(...value)
    })

    const uniqTokens = uniq(tokens)
    if (uniqTokens.length === 0) {
      return
    }

    if (uniqTokens.length === 1) {
      return uniqTokens[0]
    }

    return `{${uniq(tokens).join(',')}}`
  }

  async function writeVirtualIconFile() {
    try {
      if (!fse.existsSync(dirId) || !fse.readdirSync(dirId).length) {
        fse.outputFileSync(generatedFileId, '')
        return
      }

      if (onDemand && graph.size === 0) {
        fse.outputFileSync(generatedFileId, '')
        return
      }

      const { cssTemplate } = await buildIcons({
        name,
        namespace,
        fontFamilyClassName: fontFamilyClassName ?? namespace,
        entry: dir,
        emitFile: false,
        matcher: onDemand ? getMatcher() : '*',
      })

      let content = ''

      if (fse.existsSync(generatedFileId)) {
        content = fse.readFileSync(generatedFileId, 'utf-8')
      }

      if (content === cssTemplate) {
        return
      }

      fse.outputFileSync(generatedFileId, cssTemplate)
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  return {
    name: 'varlet-unplugin-icon-builder',
    enforce: 'pre',

    async buildStart() {
      await writeVirtualIconFile()
    },

    resolveId(id) {
      if (id === moduleId) {
        return generatedFileId
      }
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
