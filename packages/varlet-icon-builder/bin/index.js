#!/usr/bin/env node
import { build, figma } from '../dist/index.js'
import { Command } from 'commander'

const program = new Command()

program
  .command('build')
  .option('-w --watch', 'Watch icons for changes and rebuild')
  .description('Build icons')
  .action(build)

program
  .command('figma')
  .option('-t --token <token>', 'Figma token')
  .option('-f --file <file>', 'Figma file id')
  .option('-s --skipExisting', 'Whether to skip downloading svg files when a file with the same name exists locally')
  .option('-c --clean', 'Whether to clear the output directory before downloading')
  .option('-o --output', 'Output path')
  .description('Parse icons from figma')
  .action(figma)

program.parse()
