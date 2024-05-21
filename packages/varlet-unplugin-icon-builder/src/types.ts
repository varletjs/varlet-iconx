export interface Options {
  dir?: string
  lib?: string
  base64?: boolean
  moduleId?: string
  generatedFilename?: string
  name?: string
  namespace?: string
  fontFamilyClassName?: string
  onDemand?:
    | boolean
    | {
        include?: string[]
        exclude?: string[]
      }
}
