import fse from 'fs-extra'
import slash from 'slash'
import chokidar from 'chokidar'
import webfont from 'webfont'
import logger from './logger.js'
import { resolve } from 'path'
import { VIConfig, getViConfig } from './config.js'

export interface IconsIo {
  entry: string
  output: string
}

const { removeSync, ensureDir, writeFile } = fse

async function removeDir(output: string, fontsDir: string, cssDir: string) {
  removeSync(output)
  await Promise.all([ensureDir(fontsDir), ensureDir(cssDir)])
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

export async function buildIcons(viConfig: Required<VIConfig>, io: IconsIo) {
  const { name, namespace, base64, publicPath, fontFamilyClassName, fontWeight, fontStyle } = viConfig

  const fontsDir = resolve(io.output, 'fonts')
  const cssDir = resolve(io.output, 'css')

  await removeDir(io.output, fontsDir, cssDir)
  const [{ ttf, glyphsData }] = await buildWebFont(name!, io.entry)

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
}

${icons
  .map(
    (icon) => `.${namespace}-${icon.name}::before {
  content: "\\${icon.pointCode}";
}`,
  )
  .join('\n\n')}
`

  await Promise.all([
    writeFile(resolve(fontsDir, `${name}-webfont.ttf`), ttf),
    writeFile(resolve(cssDir, `${name}.css`), cssTemplate),
    writeFile(resolve(cssDir, `${name}.less`), cssTemplate),
    writeFile(resolve(io.output, 'index.js'), indexTemplate),
  ])

  logger.success('build success!')
}

export interface BuildCommandOptions {
  watch?: boolean
}

export async function build({ watch = false }: BuildCommandOptions = {}) {
  const viConfig = await getViConfig()
  const { entry = './svg', output = './dist' } = viConfig
  const io = {
    entry: resolve(process.cwd(), entry),
    output: resolve(process.cwd(), output),
  }

  const task = () => buildIcons(viConfig, io)

  if (watch) {
    await buildIcons(viConfig, io)
    chokidar.watch(io.entry, { ignoreInitial: true }).on('all', task)
    logger.info(`watching for ${io.entry} changes...`)
    return
  }

  await task()
}
