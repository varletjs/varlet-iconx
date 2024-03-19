<h1 align="center">Varlet Release</h1>

<p align="center">
  <span>English</span> | 
  <a href="https://github.com/varletjs/release/blob/main/README.zh-CN.md">中文</a>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@varlet/release" target="_blank" rel="noopener noreferrer"><img src="https://badgen.net/npm/v/@varlet/release" alt="NPM Version" /></a>
  <a href="https://github.com/varletjs/release/blob/main/LICENCE" target="_blank" rel="noopener noreferrer"><img src="https://badgen.net/github/license/varletjs/release" alt="License" /></a>
</p>

## Intro

`Varlet Release` is a tool to release all packages, generate changelogs and lint commit message.

## Installation

### npm

```shell
npm i @varlet/release -D
```

### yarn

```shell
yarn add @varlet/release -D
```

### pnpm

```shell
pnpm add @varlet/release -D
```

## Usage

### Using Command

```shell
# Release all packages and generate changelogs
npx vr release

# Specify remote name
npx vr release -r https://github.com/varletjs/varlet-release
# or
npx vr release --remote https://github.com/varletjs/varlet-release

# Just generate changelogs
npx vr changelog

# Specify changelog filename
npx vr changelog -f changelog.md
# or
npx vr changelog --file changelog.md

# Lint commit message
npx vr lint-commit -p .git/COMMIT_EDITMSG

# Publish to npm, which can be called in the ci environment
npx vr publish
```

### Configuration

#### release

| Params                 | Instructions        |
| ---------------------- | ------------------- |
| -r --remote \<remote\> | Specify remote name |
| -s --skip-npm-publish  | Skip npm publish    |
| -sc --skip-changelog    | Skip generate changelog    |
| -sgt --skip-git-tag    | Skip git tag        |
| -nt --npm-tag \<npmTag\>   | npm tag        |

#### changelog

| Params                              | Instructions               |
| ----------------------------------- | -------------------------- |
| -f --file \<filename\>              | Specify changelog filename |
| -rc --releaseCount \<releaseCount\> | Release count              |

#### lint-commit

| Params                          | Instructions                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| -p --commitMessagePath \<path\> | The path of the temporary file to which the git message is submitted. The git hook commit-msg will pass this parameter |
| -r --commitMessageRe \<reg\>    | Validate the regular of whether the commit message passes                                                              |
| -e --errorMessage \<message\>   | Validation failed to display error messages                                                                            |
| -w --warningMessage \<message\> | Validation failed to display warning messages                                                                          |

#### publish

| Params                      | Instructions                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| -c --check-remote-version | Detects whether the remote version of the npm package is the same as the package version to be published locally, and if it is, skip the release |
| -nt --npm-tag \<npmTag\>   | npm tag        |

### Custom Handle

#### Example

```js
import { release, changelog } from '@varlet/release'

// Do what you want to do...
release()
```

You can pass in a task that will be called before the publish after the package version is changed.

```js
import { release, changelog } from '@varlet/release'

async function task() {
  await doSomething1()
  await doSomething2()
}

release({ task })
```

#### Types

```ts
interface PublishCommandOptions {
  preRelease?: boolean
  checkRemoteVersion?: boolean
  npmTag?: string
}
function publish({ preRelease, checkRemoteVersion, npmTag }: PublishCommandOptions): Promise<void>
function updateVersion(version: string): void
interface ReleaseCommandOptions {
  remote?: string
  skipNpmPublish?: boolean
  skipChangelog?: boolean
  skipGitTag?: boolean
  npmTag?: string
  task?(): Promise<void>
}
function release(options: ReleaseCommandOptions): Promise<void>

interface ChangelogCommandOptions {
  file?: string
  releaseCount?: number
}
function changelog({ releaseCount, file }?: ChangelogCommandOptions): Promise<void>

const COMMIT_MESSAGE_RE: RegExp
function isVersionCommitMessage(message: string): string | false | null
function getCommitMessage(commitMessagePath: string): string
interface CommitLintCommandOptions {
  commitMessagePath: string
  commitMessageRe?: string | RegExp
  errorMessage?: string
  warningMessage?: string
}
function commitLint(options: CommitLintCommandOptions): void
```

## License

[MIT](https://github.com/varletjs/release/blob/main/LICENCE)
