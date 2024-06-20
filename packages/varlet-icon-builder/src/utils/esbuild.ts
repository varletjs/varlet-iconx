import { GenerateFramework } from './config.js'
import esbuild from 'esbuild'

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

export function getTransformResult(
  content: string,
  framework: GenerateFramework,
  format: 'cjs' | 'esm',
  filename: string,
  outputExtname: string,
) {
  return esbuild
    .transform(content, {
      loader: getEsbuildLoader(framework),
      target: 'es2016',
      format,
    })
    .then(({ code }) => ({
      code,
      filename: filename.replace('.ts', outputExtname).replace('.vue', outputExtname),
    }))
}
