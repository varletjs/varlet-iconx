export interface Options {
  dir?: string
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
