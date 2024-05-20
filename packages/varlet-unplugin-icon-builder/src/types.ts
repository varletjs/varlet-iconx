export interface Options {
  dir?: string
  lib?: string
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
