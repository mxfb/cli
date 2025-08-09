import process from 'node:process'
import { promises as fs } from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { program } from 'commander'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

program
  .name('@mxfb/cli')
  .description('The home of @mxfb/cli\'s project')
  .option('-v, --version', 'output the current version')
  .action(async options => 'version' in options
    ? await printVersion()
    : program.help())
  
program
  .command('list')
  .description('list all the available commands')
  .action(printCommands)

program
  .command('version')
  .description('print current version of the package')
  .action(printVersion)

const subCommands = await listCommands()
subCommands.forEach(subCommand => {
  program
    .command(subCommand, { hidden: true })
    .allowUnknownOption(true)
    .action(async (...args) => {
      const [_nodePath, _thisPath, targetCommand, ...forwardedArgs] = process.argv
      if (targetCommand === undefined) return program.help()
      const commandsList = await listCommands()
      if (!commandsList.includes(targetCommand)) return program.help()
      const subprogramPath = path.join(__dirname, '../', targetCommand, 'index.js')
      const subprocess = spawn(subprogramPath, forwardedArgs, { stdio: 'inherit' })
      subprocess.on('error', err => console.error(`Failed to start subprogram '${targetCommand}':`, err))
    })
})

program.parse(process.argv)

async function listCommands () {
  const listFilePath = path.join(__dirname, 'assets/list.txt')
  const list = await fs.readFile(listFilePath, { encoding: 'utf-8' })
  return list.split('\n').map(e => e.trim())
}

async function printCommands () {
  const list = await listCommands()
  const output = list
    .map(c => {
      const twentyFourCharName = Object.assign(
        new Array(24).fill(' ') as string[],
        c.split('') as string[]
      ).join('')
      if (c === 'cli') return `${twentyFourCharName} # npx @mxfb/cli help`
      return `${twentyFourCharName} # npx @mxfb/cli ${c} help`
    })
    .join('\n')
  console.log(output)
  return;
}

async function printVersion () {
  const versionFilePath = path.join(__dirname, 'assets/version.txt')
  const version = await fs.readFile(versionFilePath, { encoding: 'utf-8' })
  console.log(version)
  return;
}
