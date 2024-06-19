import { GenerateFramework } from './config.js'

export function getEsbuildLoader(framework: GenerateFramework) {
  switch (framework) {
    case GenerateFramework.vue3:
      return 'ts'
    case GenerateFramework.react:
      return 'tsx'
    default:
      return 'ts'
  }
}
