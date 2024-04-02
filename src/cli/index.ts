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
  .option('-v, --version', 'print program\'s version')
  .action(async options => {
    if (options.version === true) {
      const versionFilePath = path.join(__dirname, 'assets/version.txt')
      const version = await fs.readFile(versionFilePath, { encoding: 'utf-8' })
      console.log(version)
    }
  })
  
program
  .command('list')
  .description('list all the available commands')
  .action(async () => {
    const listFilePath = path.join(__dirname, 'assets/list.txt')
    const list = await fs.readFile(listFilePath, { encoding: 'utf-8' })
    console.log(list)
  })

program
  .command('version')
  .description('print current version of the package')
  .action(async () => {
    const versionFilePath = path.join(__dirname, 'assets/version.txt')
    const version = await fs.readFile(versionFilePath, { encoding: 'utf-8' })
    console.log(version)
  })

program.parse(process.argv)

