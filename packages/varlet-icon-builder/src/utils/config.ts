import { loadConfig } from 'unconfig'

export interface VIConfig {
  /**
   * @default `varlet-icons`
   * font name.
   */
  name?: string
  /**
   * @default `var-icon`
   * font name prefix.
   */
  namespace?: string
  /**
   * @default `true`
   * output base64
   */
  base64?: boolean
  /**
   * @default `./svg`
   * svg icons folder path.
   */
  entry?: string
  /**
   * @default `./dist`
   * svg icons folder path.
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
  /**
   * @default `false`
   * Whether to output files
   */
  emitFile?: boolean
  /**
   * icon font public path
   */
  publicPath?: string
  /**
   * icon font public url
   */
  publicURL?: string
  /**
   * icon filenames, e.g. ['window-close', 'cog']
   */
  filenames?: string[]
  /**
   * figma parsing options
   */
  figma?: {
    /**
     * figma token
     * @see https://www.figma.com/developers/api#authentication
     */
    token?: string
    /**
     * figma file id
     */
    file?: string
    /**
     * @default `Icons`
     * figma icons page name
     */
    pageName?: string
    /**
     * @default `false`
     * whether to skip downloading svg files when a file with the same name exists locally
     */
    skipExisting?: boolean
    /**
     * @default `false`
     * whether to clear the output directory before downloading
     */
    clean?: boolean
    /**
     * @default `./svg-figma`
     * output path
     */
    output?: string
  }

  generate?: {
    entry?: string
    wrapperComponentName?: string
    framework?: 'vue3' | 'react'
    output?: {
      component?: string
      types?: string
      esm?: string
      cjs?: string
    }
  }
}

export function defineConfig(config: VIConfig) {
  return config
}

export async function getViConfig(): Promise<VIConfig> {
  const { config } = await loadConfig<VIConfig>({
    sources: [
      {
        files: 'vi.config',
      },
    ],
  })

  return config ?? {}
}
