import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { buildIcons } from '@varlet/icon-builder'
import { isAbsolute, resolve, basename } from 'path'
import { debounce, isPlainObject, uniq, slash } from '@varlet/shared'
import { Worker } from 'worker_threads'
import { cpus } from 'os'
import glob from 'fast-glob'
import fse from 'fs-extra'
import chokidar from 'chokidar'

export function resolvePath(path: string) {
  return isAbsolute(path) ? path : resolve(process.cwd(), path)
}

export function resolveLib(lib: string) {
  const path = resolvePath(`./node_modules/${lib}`)

  return fse.existsSync(path) ? path : ''
}

export function splitArrayIntoChunks(array: any[], numChunks: number) {
  const chunks = []
  const chunkSize = Math.ceil(array.length / numChunks)

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize
    const end = start + chunkSize
    chunks.push(array.slice(start, end))
  }

  return chunks
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options: Options = {}) => {
  const {
    lib,
    moduleId = 'virtual-icons',
    generatedFilename = 'virtual.icons.css',
    name = 'i-icons',
    dir = './svg-icons',
    namespace = 'i',
    fontFamilyClassName,
    base64 = true,
    onDemand = false,
  } = options
  const libId = lib ? resolveLib(lib) : ''
  if (lib && !libId) {
    console.warn(`cannot resolve lib, fallback to dir ${dir}`)
  }

  const dirId = resolvePath(dir)
  if (!libId && !fse.existsSync(dirId)) {
    throw new Error(`cannot resolve dir, please check ${dirId}`)
  }

  const generatedFileId = resolvePath(generatedFilename)
  const generatedFontId = resolvePath(generatedFilename.replace('.css', '.ttf'))
  const graph = new Map<string, string[]>()
  const tokens: string[] = []
  let waitWorkers: Promise<any> = Promise.resolve()
  const waitWrite: Promise<any> = Promise.resolve()

  initWatcher()
  initOnDemand()
  writeVirtualIconFile()

  function getLibIdOrDirId() {
    return libId || dirId
  }

  function isSameGraphTokens(value: string[], target: string[]) {
    return value.sort().join('/') === target.sort().join('/')
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
      updateGraphByWorkers()
    }
  }

  function updateGraphByWorkers() {
    graph.clear()
    const { include, exclude } = getOnDemandFilter()
    const numThreads = cpus().length + 1
    const paths = glob.sync(include, { ignore: exclude })
    const chunks = splitArrayIntoChunks(paths, numThreads)

    const workers = chunks
      .filter((chunk) => chunk.length)
      .map((chunk) => new Worker(resolve(__dirname, './worker.js'), {
          workerData: {
            paths: chunk,
            tokens,
            namespace,
          },
        }))

    waitWorkers = Promise.all(
      workers.map((worker) => new Promise((resolve) => {
          worker.on('message', (result: Array<{ path: string; existedTokens: string[] }>) => {
            result.forEach(({ path, existedTokens }) => {
              graph.set(path, existedTokens)
              resolve(1)
            })
          })
        })),
    )

    return waitWorkers
  }

  function updateGraphNode(eventName: string, path: string) {
    path = resolvePath(path)
    const graphTokens = graph.get(path) ?? []

    if (eventName === 'add' || eventName === 'change') {
      const content = fse.readFileSync(path, 'utf-8')
      const existedTokens = tokens.filter((token) =>
        new RegExp(`(?<!-)\\b(${token}|${namespace}-${token})\\b(?!-)`).test(content),
      )

      if (existedTokens.length > 0) {
        graph.set(path, existedTokens)
      } else {
        graph.delete(path)
      }

      return isSameGraphTokens(graphTokens, existedTokens)
    }

    if (eventName === 'unlink') {
      graph.delete(path)
      return isSameGraphTokens(graphTokens, [])
    }
  }

  function updateTokens() {
    tokens.length = 0
    const svgTokens = getSvgTokens()
    tokens.push(...svgTokens)
  }

  function getSvgTokens() {
    return glob.sync(`${slash(getLibIdOrDirId())}/**/*.svg`).map((file) => basename(file).replace('.svg', ''))
  }

  function getFilenames() {
    const tokens: string[] = []

    graph.forEach((value) => {
      tokens.push(...value)
    })

    return uniq(tokens)
  }

  function initWatcher() {
    if (process.env.NODE_ENV === 'development') {
      const writeVirtualIconFileWithDebounce = debounce(writeVirtualIconFile, 20)
      const initOnDemandWithDebounce = debounce(initOnDemand, 20)

      if (!libId) {
        // lib no need to watch, because it's a package in node_modules
        chokidar.watch(dirId, { ignoreInitial: true }).on('all', () => {
          initOnDemandWithDebounce()
          writeVirtualIconFileWithDebounce()
        })
      }

      if (onDemand) {
        const { include, exclude } = getOnDemandFilter()
        chokidar.watch(include, { ignoreInitial: true, ignored: exclude }).on('all', (eventName, path) => {
          const isSame = updateGraphNode(eventName, path)
          if (isSame) {
            return
          }
          // graph node is same after update, no need to update virtual icon file
          writeVirtualIconFileWithDebounce()
        })
      }
    }
  }

  async function writeVirtualIconFile() {
    await waitWorkers
    try {
      const libIdOrDirId = getLibIdOrDirId()

      if (!fse.readdirSync(libIdOrDirId).length) {
        fse.outputFileSync(generatedFileId, '')
        return
      }

      if (onDemand && graph.size === 0) {
        fse.outputFileSync(generatedFileId, '')
        return
      }

      const { ttf, cssTemplate } = await buildIcons({
        base64,
        emitFile: false,
        name,
        namespace,
        publicURL: `./${basename(generatedFontId)}?_t=${Date.now()}`,
        fontFamilyClassName: fontFamilyClassName ?? namespace,
        entry: libIdOrDirId,
        filenames: onDemand ? getFilenames() : undefined,
      })

      let content = ''

      if (fse.existsSync(generatedFileId)) {
        content = fse.readFileSync(generatedFileId, 'utf-8')
      }

      if (content === cssTemplate) {
        return
      }

      fse.outputFileSync(generatedFileId, cssTemplate)

      if (!base64) {
        fse.outputFileSync(generatedFontId, ttf)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return {
    name: 'varlet-unplugin-icon-builder',
    enforce: 'pre',

    async buildStart() {
      await Promise.all([waitWorkers, waitWrite])
    },

    async resolveId(id) {
      if (id === moduleId) {
        return generatedFileId
      }
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
