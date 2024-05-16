import { resolve, isAbsolute } from 'path'

export function slash(path: string) {
  const isExtendedLengthPath = path.startsWith('\\\\?\\')

  if (isExtendedLengthPath) {
    return path
  }

  return path.replace(/\\/g, '/')
}

export function resolvePath(path: string) {
  return isAbsolute(path) ? path : resolve(process.cwd(), path)
}
