import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { buildIcons } from '@varlet/icon-builder'
import { resolve } from 'path'
import fse from 'fs-extra'
import chokidar from 'chokidar'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options: Options = {}) => {
  const {
    moduleId = 'virtual-icons',
    generatedFilename = 'virtual.icons.css',
    name = 'i-icons',
    dir = './svg-icons',
    namespace = 'i',
    fontFamilyClassName,
  } = options

  const generatedFileId = resolve(process.cwd(), generatedFilename)
  const dirId = resolve(process.cwd(), dir)

  console.log(process.env.NODE_ENV)
  if (process.env.NODE_ENV === 'development') {
    chokidar.watch(dirId, { ignoreInitial: true }).on('all', writeVirtualIconFile)
  }

  async function writeVirtualIconFile() {
    try {
      if (!fse.existsSync(dirId) || !fse.readdirSync(dirId).length) {
        fse.outputFileSync(generatedFileId, '')
        return
      }

      const { cssTemplate } = await buildIcons({
        name,
        namespace,
        fontFamilyClassName: fontFamilyClassName ?? namespace,
        entry: dir,
        emitFile: false,
      })

      let content = ''

      if (fse.existsSync(generatedFileId)) {
        content = fse.readFileSync(generatedFileId, 'utf-8')
      }

      if (content === cssTemplate) {
        return
      }

      fse.writeFileSync(generatedFileId, cssTemplate)
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
