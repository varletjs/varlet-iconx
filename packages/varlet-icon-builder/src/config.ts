import fse from 'fs-extra'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

const { pathExistsSync, statSync } = fse

export interface VIConfig {
  /**
   * @default `varlet-icons`
   * Font name.
   */
  name?: string
  /**
   * @default `var-icon`
   * Font name prefix.
   */
  namespace?: string
  /**
   * @default `true`
   * Output base64
   */
  base64?: boolean
  /**
   * @default `./svg`
   * SVG icons folder path.
   */
  entry?: string
  /**
   * @default `./dist`
   * SVG icons folder path.
   */
  output?: string
  /**
   * @default `var-icon--set`
   * icon font family class name.
   */
  fontFamilyClassName?: string
  /**
   * @default `normal`
   * icon font weight.
   */
  fontWeight?: string
  /**
   * @default `normal`
   * icon font style.
   */
  fontStyle?: string
  publicPath?: string
  /**
   * @default `false`
   * Whether to output files
   */
  emitFile?: boolean
}

export function defineConfig(config: VIConfig) {
  return config
}

export async function getViConfig(): Promise<Required<VIConfig>> {
  const VI_CONFIG = resolve(process.cwd(), 'vi.config.mjs')
  const config: any = pathExistsSync(VI_CONFIG)
    ? (await import(`${pathToFileURL(VI_CONFIG).href}?_t=${statSync(VI_CONFIG).mtimeMs}`)).default
    : {}

  return config
}
