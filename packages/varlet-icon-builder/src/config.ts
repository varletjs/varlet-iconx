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

  return config
}
