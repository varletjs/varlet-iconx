import fse from 'fs-extra'
import { parentPort, workerData } from 'worker_threads'

const { paths, tokens, namespace } = workerData as { paths: string[]; namespace: string; tokens: string[] }

const result = paths.reduce(
  (result, path) => {
    const content = fse.readFileSync(path, 'utf-8')
    const existedTokens = tokens.filter((token) =>
      new RegExp(`(?<!-)\\b(${token}|${namespace}-${token})\\b(?!-)`).test(content),
    )

    result.push({ path, existedTokens })

    return result
  },
  [] as Array<{ path: string; existedTokens: string[] }>,
)

parentPort?.postMessage(result)
