#!/usr/bin/env node
import { build } from '../dist/index.js'
import { Command } from 'commander'

const program = new Command()

program
  .command('build')
  .option('-w --watch', 'Watch icons for changes and rebuild')
  .description('Build icons')
  .action(async (options) => build(options))

program.parse()
