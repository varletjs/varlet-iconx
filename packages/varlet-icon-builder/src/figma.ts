import { AxleInstance, createAxle } from '@varlet/axle'
import { kebabCase } from '@varlet/shared'
import { resolve } from 'path'
import { getViConfig } from './config.js'
import fse from 'fs-extra'
import logger from './logger.js'

export interface FigmaCommandOptions {
  file?: string
  token?: string
  skipExisting?: boolean
  clean?: boolean
  output?: string
}

export interface FigmaDocument {
  id: string
  name: string
  type: string
  children: FigmaNode[]
}

export interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
}

export interface Icon {
  name: string
  id: string
}

export type Icons = Record<string, Icon>

export function parseIcons(document: FigmaDocument) {
  return document.children.reduce((icons, canvas) => {
    canvas.children?.forEach((node) => {
      if (node.type === 'FRAME' || node.type === 'COMPONENT') {
        icons[node.id] = {
          id: node.id,
          name: kebabCase(node.name.toLowerCase()),
        }
      }
    })

    return icons
  }, {} as Icons)
}

export async function getDocument(axle: AxleInstance, file: string) {
  // https://www.figma.com/developers/api#get-files-endpoint
  const response = await axle.get(`https://api.figma.com/v1/files/${file}`)

  return response.data.document as FigmaDocument
}

export async function getSvgUrls(axle: AxleInstance, file: string, icons: Icons) {
  // https://www.figma.com/developers/api#get-images-endpoint
  const response = await axle.get(`https://api.figma.com/v1/images/${file}`, {
    ids: Object.keys(icons).join(','),
    format: 'svg',
  })

  return response.data.images ?? {}
}

export async function downloadSvgUrls(
  axle: AxleInstance,
  svgUrls: Record<string, string>,
  icons: Icons,
  {
    output,
    clean,
    skipExisting,
  }: {
    clean: boolean
    output: string
    skipExisting: boolean
  },
) {
  if (clean) {
    fse.removeSync(output)
  }

  let successfulCount = 0
  let failedCount = 0
  const total = Object.keys(svgUrls).length

  await Promise.all(
    Object.entries(svgUrls).map(([id, url]) => {
      const {name} = icons[id]
      const target = `${output}/${name}.svg`

      if (skipExisting && fse.existsSync(target)) {
        successfulCount++
        logger.success(`skip download ${name}.svg! (${successfulCount}/${total})`)
        return Promise.resolve(true)
      }

      return new Promise((resolve) => {
        axle
          .getText(url)
          .then((response) => {
            fse.outputFileSync(target, response.data)
            successfulCount++
            logger.success(`download ${icons[id].name}.svg success! (${successfulCount}/${total})`)
            resolve(true)
          })
          .catch(() => {
            failedCount++
            logger.error(`download ${icons[id].name}.svg failed! (${failedCount}/${total})`)
            resolve(false)
          })
      })
    }),
  )
}

export async function figma(options: FigmaCommandOptions) {
  const config = (await getViConfig()) ?? {}
  const {
    token,
    file,
    output = 'figma-svg',
    clean = false,
    skipExisting = false,
  } = { ...(config.figma ?? {}), ...options }

  if (!token) {
    logger.error('figma token is required!')
    return
  }

  if (!file) {
    logger.error('figma file is required!')
    return
  }

  const axle = createAxle({
    headers: {
      'X-Figma-Token': token,
    },
  })

  logger.info('figma parsing...')

  try {
    const document = await getDocument(axle, file)
    const icons = parseIcons(document)
    const svgUrls = await getSvgUrls(axle, file, icons)
    await downloadSvgUrls(axle, svgUrls, icons, { output: resolve(process.cwd(), output), clean, skipExisting })
  } catch (error: any) {
    logger.error(error.toString())
    
  }
}
