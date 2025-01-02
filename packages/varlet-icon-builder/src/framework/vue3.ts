import fse from 'fs-extra'
import { resolve } from 'path'
import { pascalCase } from 'rattail'
import { injectSvgCurrentColor, removeExtname } from '../utils/shared.js'
import { INDEX_D_FILE, INDEX_FILE } from '../utils/constants.js'

export function injectVueSfcSvgStyle(content: string) {
  return content.replace('<svg', '<svg style="width: var(--x-icon-size, 1em); height: var(--x-icon-size, 1em)"')
}

export function generateVueSfcTypes({
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
    if (filename === `${wrapperComponentName}.vue`) {
      fse.outputFileSync(
        resolve(output, `${wrapperComponentName}.d.ts`),
        `\
export default class ${wrapperComponentName} {
  static name: string
    
  $props: {
    size?: string | number
    color?: string
  }
}`,
      )
    } else {
      const componentName = removeExtname(filename)
      fse.outputFileSync(
        resolve(output, `${componentName}.d.ts`),
        `\
export default class ${componentName} {
  static name: string

  $props: {}
}`,
      )
    }
  })

  const indexContent = filenames
    .map((filename) => `export { default as ${removeExtname(filename)} } from './${removeExtname(filename)}'`)
    .join('\n')

  fse.outputFileSync(resolve(output, INDEX_D_FILE), indexContent)
}

export function generateVueSfc(
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
    const sfcContent = compileSvgToVueSfc(filename.replace('.svg', ''), content, isColorful)

    fse.outputFileSync(resolve(output, pascalCase(filename.replace('.svg', '.vue'))), sfcContent)
  })

  fse.outputFileSync(
    resolve(output, `${wrapperComponentName}.vue`),
    `\
<template>
  <i :style="style">
    <slot />
  </i>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
  
export default defineComponent({
  name: '${wrapperComponentName}',
  props: {
    size: {
      type: [String, Number],
      default: '1em',
    },
    color: {
      type: String,
      default: 'currentColor',
    }
  },
  setup(props) {
    const style = computed(() => ({
      display: 'inline-flex',
      color: props.color,
      '--x-icon-size': typeof props.size === 'number' ? \`\${props.size}px\` : props.size,
    }))
      
    return {
      style
    }
  }
})
</script>`,
  )
}

export function compileSvgToVueSfc(name: string, content: string, isColorful: boolean) {
  content = content.match(/<svg (.|\n|\r)*/)?.[0] ?? ''

  if (!isColorful) {
    content = injectSvgCurrentColor(content)
  }

  content = injectVueSfcSvgStyle(content)
  return `\
<template>
  ${content}
</template>
  
<script lang="ts">
import { defineComponent } from 'vue'
  
export default defineComponent({
  name: '${pascalCase(name)}',
})
</script>`
}
