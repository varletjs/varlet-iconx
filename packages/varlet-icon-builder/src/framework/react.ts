import fse from 'fs-extra'
import { resolve } from 'path'
import { pascalCase, camelize } from 'rattail'
import { injectSvgCurrentColor, removeExtname } from '../utils/shared'
import { INDEX_D_FILE, INDEX_FILE } from '../utils/constants'

export function camelizeSvgAttributes(content: string) {
  return content.replace(/((\w|-|:)+)(?==")/g, (_, p1) => camelize(p1.replace(/:/g, '-')))
}

export function injectReactTsxSvgStyle(content: string) {
  return content.replace('<svg', "<svg style={{ width: 'var(--x-icon-size, 1em)', height: 'var(--x-icon-size, 1em)' }}")
}

export function generateReactTsxTypes({
  entry,
  output,
  wrapperComponentName,
}: {
  entry: string
  output: string
  wrapperComponentName: string
}) {
  fse.removeSync(output)

  const filenames = fse.readdirSync(entry).filter((filename) => filename !== INDEX_FILE)
  filenames.forEach((filename) => {
    if (filename === `${wrapperComponentName}.tsx`) {
      fse.outputFileSync(
        resolve(output, `${wrapperComponentName}.d.ts`),
        `\
import * as React from 'react'

declare const ${wrapperComponentName}: React.FunctionComponent<{ 
  color?: string 
  size?: string | number
  children?: React.ReactElement
}>
        
export default ${wrapperComponentName}`,
      )
    } else {
      const componentName = removeExtname(filename)
      fse.outputFileSync(
        resolve(output, `${componentName}.d.ts`),
        `\
import * as React from 'react'

declare const ${componentName}: React.FunctionComponent<{}>

export default ${componentName}`,
      )
    }
  })

  const indexContent = filenames
    .map((filename) => `export { default as ${removeExtname(filename)} } from './${removeExtname(filename)}'`)
    .join('\n')

  fse.outputFileSync(resolve(output, INDEX_D_FILE), indexContent)
}

export function generateReactTsx(
  entry: string,
  output: string,
  wrapperComponentName: string,
  colorful: (name: string, content: string) => boolean,
) {
  fse.removeSync(output)

  const filenames = fse.readdirSync(entry)
  filenames.forEach((filename) => {
    const file = resolve(process.cwd(), entry, filename)
    const content = fse.readFileSync(file, 'utf-8')
    const isColorful = colorful(filename, content)
    const tsxContent = compileSvgToReactTsx(filename.replace('.svg', ''), content, isColorful)

    fse.outputFileSync(resolve(output, pascalCase(filename.replace('.svg', '.tsx'))), tsxContent)
  })

  fse.outputFileSync(
    resolve(output, `${wrapperComponentName}.tsx`),
    `\
import React, { ReactNode, CSSProperties } from 'react'
  
export interface ${wrapperComponentName}Props {
  size?: string | number
  color?: string
  children?: ReactNode
}
  
const ${wrapperComponentName}: React.FC<${wrapperComponentName}Props> = ({ size = '1em', color = 'currentColor', children }) => {
  const style: CSSProperties = {
    display: 'inline-flex',
    color,
    '--x-icon-size': typeof size === 'number' ? \`\${size}px\` : size,
  };
    
  return <i style={style}>{children}</i>
}
  
export default ${wrapperComponentName}`,
  )
}

export function compileSvgToReactTsx(name: string, content: string, isColorful: boolean) {
  content = content.match(/<svg (.|\n|\r)*/)?.[0] ?? ''

  if (!isColorful) {
    content = injectSvgCurrentColor(content)
  }

  content = injectReactTsxSvgStyle(camelizeSvgAttributes(content))
  return `\
import React from 'react'
  
const ${pascalCase(name)}: React.FC = () => (
  ${content}
)
  
export default ${pascalCase(name)}`
}
