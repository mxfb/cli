import process from 'node:process'
import { promises as fs } from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { program, Command } from 'commander'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

program
  .name('@mxfb-cli/cli')
  .description('The home of @mxfb/cli\'s project')
  
program
  .command('list')
  .description('list all the available commands')
  .action(printCommands)

program
  .command('version')
  .description('print current version of the package')
  .action(printVersion)

program
  .command('*', { hidden: true })
  .allowUnknownOption()
  .action(async (...args) => {
    const [, command] = args as [any, Command]
    console.log(command.args)
    const [targetCommand] = command.args
    if (targetCommand === undefined) return program.help()
    const commandsList = await listCommands()
    if (!commandsList.includes(targetCommand)) return program.help()
    const forwardedArgs = command.args.slice(1)
    const subprogramPath = path.join(__dirname, '../', targetCommand, 'index.js')
    const subprocess = spawn(subprogramPath, forwardedArgs, { stdio: 'inherit' })
    subprocess.on('error', err => console.error(`Failed to start subprogram '${targetCommand}':`, err))
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
      if (c === 'cli') return `${twentyFourCharName} # npx @mxfb/cli --help`
      return `${twentyFourCharName} # npx @mxfb/cli ${c} --help`
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
