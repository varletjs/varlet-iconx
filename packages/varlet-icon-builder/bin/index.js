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
  .description('Parse icons from figma')
  .action(figma)

program.parse()
