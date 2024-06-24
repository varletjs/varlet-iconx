import esbuild from 'esbuild'

export function getTransformResult({
  filename,
  content,
  loader,
  format,
  outputExtname,
}: {
  filename: string
  content: string
  loader: 'ts' | 'tsx'
  format: 'cjs' | 'esm'
  outputExtname: string
}) {
  return esbuild
    .transform(content, {
      loader,
      target: 'es2016',
      format,
    })
    .then(({ code }) => ({
      code,
      filename: filename.replace('.ts', outputExtname).replace('.vue', outputExtname),
    }))
}
