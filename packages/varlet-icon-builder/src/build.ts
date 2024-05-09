import fse from 'fs-extra'
import slash from 'slash'
import chokidar from 'chokidar'
import webfont from 'webfont'
import logger from './logger.js'
import { resolve } from 'path'
import { VIConfig, getViConfig } from './config.js'

export interface BuildCommandOptions {
  watch?: boolean
}

const { removeSync, ensureDirSync, writeFile } = fse

function clearOutputs(fontsDir: string, cssDir: string) {
  removeSync(fontsDir)
  removeSync(cssDir)
  ensureDirSync(fontsDir)
  ensureDirSync(cssDir)
}

function buildWebFont(name: string, entry: string) {
  return webfont.default({
    files: `${slash(entry)}/*.svg`,
    fontName: name,
    formats: ['ttf'],
    fontHeight: 512,
    descent: 64,
  })
}

export async function buildIcons(viConfig: VIConfig) {
  const {
    name = 'varlet-icons',
    namespace = 'var-icon',
    base64 = true,
    fontFamilyClassName = 'var-icon--set',
    fontWeight = 'normal',
    fontStyle = 'normal',
    publicPath,
    emitFile = true,
  } = viConfig

  const io = getIo(viConfig)
  const fontsDir = resolve(io.output, 'fonts')
  const cssDir = resolve(io.output, 'css')

  if (emitFile) {
    clearOutputs(fontsDir, cssDir)
  }

  const { ttf, glyphsData } = await buildWebFont(name, io.entry)

  const icons: { name: string; pointCode: string }[] = glyphsData.map((i: any) => ({
    name: i.metadata.name,
    pointCode: i.metadata.unicode[0].charCodeAt(0).toString(16),
  }))

  const iconNames = icons.map((iconName) => `  '${iconName.name}'`)

  const indexTemplate = `\
export const pointCodes = {
  ${icons.map(({ pointCode, name }) => `'${name}': '${pointCode}'`).join(',\n  ')}
}

export default [
${iconNames.join(',\n')}
]
`

  const cssTemplate = `\
@font-face {
  font-family: "${name}";
  src: url("${
    base64 ? `data:font/truetype;charset=utf-8;base64,${ttf.toString('base64')}` : `${publicPath}${name}-webfont.ttf`
  }") format("truetype");
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
}

.${fontFamilyClassName} {
  font-family: "${name}";
  font-style: ${fontStyle};
}

${icons
  .map(
    (icon) => `.${namespace}-${icon.name}::before {
  content: "\\${icon.pointCode}";
}`,
  )
  .join('\n\n')}
`

  if (emitFile) {
    await Promise.all([
      writeFile(resolve(fontsDir, `${name}-webfont.ttf`), ttf),
      writeFile(resolve(cssDir, `${name}.css`), cssTemplate),
      writeFile(resolve(cssDir, `${name}.less`), cssTemplate),
      writeFile(resolve(cssDir, `${name}.scss`), cssTemplate),
      writeFile(resolve(io.output, 'index.js'), indexTemplate),
    ])

    logger.success('build icons success!')
  }

  return {
    indexTemplate,
    cssTemplate,
  }
}

export function getIo(viConfig: VIConfig) {
  const { entry = './svg', output = './dist' } = viConfig
  const io = {
    entry: resolve(process.cwd(), entry),
    output: resolve(process.cwd(), output),
  }
  return io
}

export async function build({ watch = false }: { watch: boolean }) {
  const viConfig = await getViConfig()

  const io = getIo(viConfig)
  const task = () => buildIcons(viConfig)

  if (watch) {
    await buildIcons(viConfig)
    chokidar.watch(io.entry, { ignoreInitial: true }).on('all', task)
    logger.info(`watching for ${io.entry} changes...`)
    return
  }

  await task()
}
