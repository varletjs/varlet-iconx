import fse from 'fs-extra'
import { resolve } from 'path'
import { bigCamelize } from '@varlet/shared'
import { injectSvgCurrentColor, injectSvgStyle } from '../utils/shared'

export function generateReactTsx(entry: string, output: string, wrapperComponentName: string) {
  fse.removeSync(output)

  const filenames = fse.readdirSync(entry)
  filenames.forEach((filename) => {
    const file = resolve(process.cwd(), entry, filename)
    const content = fse.readFileSync(file, 'utf-8')
    const tsxContent = compileSvgToReactTsx(filename.replace('.svg', ''), content)

    fse.outputFileSync(resolve(output, bigCamelize(filename.replace('.svg', '.tsx'))), tsxContent)
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

export function compileSvgToReactTsx(name: string, content: string) {
  content = injectSvgStyle(injectSvgCurrentColor(content.match(/<svg (.|\n|\r)*/)?.[0] ?? ''))
  return `\
import React from 'react'
  
const ${bigCamelize(name)}: React.FC = () => (
  ${content}
)
  
export default ${bigCamelize(name)}`
}