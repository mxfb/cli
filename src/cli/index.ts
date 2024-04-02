import process from 'node:process'
import { promises as fs } from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { program } from 'commander'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

program
  .name('@mxfb-cli/cli')
  .description('The home of @mxfb/cli\'s project')
  .option('-l, --list', 'list all the available commands')
  .option('-v, --version', 'print current version of the package')
  .action(async options => {
    if (options.list === true) listCommands()
    else if (options.version === true) printVersion()
    else program.help()
  })
  
program
  .command('list')
  .description('list all the available commands')
  .action(listCommands)

program
  .command('version')
  .description('print current version of the package')
  .action(printVersion)

program.parse(process.argv)

async function listCommands () {
  const listFilePath = path.join(__dirname, 'assets/list.txt')
  const list = await fs.readFile(listFilePath, { encoding: 'utf-8' })
  console.log(list)
}

async function printVersion () {
  const versionFilePath = path.join(__dirname, 'assets/version.txt')
  const version = await fs.readFile(versionFilePath, { encoding: 'utf-8' })
  console.log(version)
}
