import type { Options } from 'tsup'
import { extname, dirname } from 'path'
import { readFileSync } from 'fs'

const nodeModules = /^(?:.*[\\/])?node_modules(?:\/(?!postgres-migrations).*)?$/

export default <Options>{
  entryPoints: ['src/*.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  esbuildPlugins: [
    {
      name: 'dirname',
      setup(build) {
        build.onLoad({ filter: /.*/ }, ({ path }) => {
          if (!path.match(nodeModules)) {
            let contents = readFileSync(path, 'utf8')
            const loader = extname(path).substring(1) as any
            const __dirname = dirname(path).replace('src', 'dist')
            contents = contents.replaceAll('__dirname', `"${__dirname}"`)

            return {
              contents,
              loader,
            }
          }
        })
      },
    },
  ],
}
