#!/usr/bin/env node
import { build, generate, figma } from '../dist/index.js'
import { Command } from 'commander'

const program = new Command()

program
  .command('build')
  .option('-w --watch', 'Watch icons for changes and rebuild')
  .description('Build icon fonts from svg files')
  .action(build)

program
  .command('generate')
  .option('-e --entry <entry>', 'Svg files directory')
  .option('-f --framework <framework>', 'Framework name, such as vue3, react')
  .option('--componentsOnly <componentsOnly>', 'Only generate components, do not generate cjs, esm modules and types')
  .option('--resolverNamespace <resolverNamespace>', 'Resolver namespace')
  .option('--wrapperComponentName <wrapperComponentName>', 'Wrapper component name')
  .option('--outputComponents <outputComponents>', 'Output svg component directory')
  .option('--outputTypes <outputTypes>', 'Output types directory')
  .option('--outputEsm <outputEsm>', 'Output esm directory')
  .option('--outputCjs <outputCjs>', 'Output cjs directory')
  .option('--outputResolver <outputResolver>', 'Output resolver directory')
  .description('Generate icon components from svg files')
  .action(generate)

program
  .command('figma')
  .option('-t --token <token>', 'Figma token')
  .option('-f --file <file>', 'Figma file id')
  .option('-p --pageName <pageName>', 'Figma icons page name')
  .option('-s --skipExisting', 'Whether to skip downloading svg files when a file with the same name exists locally')
  .option('-c --clean', 'Whether to clear the output directory before downloading')
  .option('-o --output', 'Output path')
  .description('Parse icons from figma')
  .action(figma)

program.parse()
