import esbuild from 'esbuild'

export function getTransformResult({
  content,
  loader,
  format,
}: {
  content: string
  loader: 'ts' | 'tsx'
  format: 'cjs' | 'esm'
}) {
  return esbuild.transform(content, {
    loader,
    target: 'es2016',
    format,
  })
}
