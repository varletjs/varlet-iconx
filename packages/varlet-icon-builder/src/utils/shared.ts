import { isAbsolute, resolve } from 'path'

export function resolvePath(path: string) {
  return isAbsolute(path) ? path : resolve(process.cwd(), path)
}

export function removeExtname(path: string) {
  return path.replace(/\.\w+$/, '')
}

export function injectSvgCurrentColor(content: string) {
  if (!content.match(/fill=".+?"/g) && !content.match(/stroke=".+?"/g)) {
    return content.replace('<svg', '<svg fill="currentColor"')
  }

  return content
    .replace(/fill="(?!none).+?"/g, 'fill="currentColor"')
    .replace(/stroke="(?!none).+?"/g, 'stroke="currentColor"')
}

export function injectSvgStyle(content: string) {
  return content.replace('<svg', '<svg style="width: var(--x-icon-size); height: var(--x-icon-size)"')
}
