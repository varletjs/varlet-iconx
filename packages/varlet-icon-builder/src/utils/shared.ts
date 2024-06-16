import { isAbsolute, resolve } from 'path'

export function resolvePath(path: string) {
  return isAbsolute(path) ? path : resolve(process.cwd(), path)
}

export function removeExtname(path: string) {
  return path.replace(/\.\w+$/, '')
}
