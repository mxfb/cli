import process from 'node:process'
import { promises as fs, existsSync } from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { program } from 'commander'
import prompts from 'prompts'
import readWriteFile from '@mxfb/tools/utils/node/read-write-file'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CWD = process.cwd()

program
  .name('@mxfb-cli/make-template')
  .description('Generate in cwd a project template')
  
program
  .command('html')
  .description('make simple html project structure')
  .action(makeHtml)

program
  .command('react')
  .description('make react + typescript project structure')
  .action(makeReact)

program.parse(process.argv)

async function makeHtml () {
  const htmlTemplatePath = path.join(__dirname, 'assets/html')
  if (!existsSync(htmlTemplatePath)) {
    console.error(`Could not find the template to copy at ${htmlTemplatePath}`)
    return process.exit(1)
  }
  const targetPath = path.join(CWD, 'html-template')
  await fs.cp(htmlTemplatePath, targetPath, { recursive: true })
}

async function makeReact () {
  const htmlTemplatePath = path.join(__dirname, 'assets/react')
  if (!existsSync(htmlTemplatePath)) {
    console.error(`Could not find the template to copy at ${htmlTemplatePath}`)
    return process.exit(1)
  }
  const targetPath = path.join(CWD, 'react-template')
  
  // Copy
  await fs.cp(htmlTemplatePath, targetPath, { recursive: true })
  const { projectName } = await prompts({
    name: 'projectName',
    message: 'Project name ? (for package.json name field)',
    type: 'text'
  })
  
  // Custom name
  const packageJsonPath = path.join(targetPath, 'package.json')
  await readWriteFile(packageJsonPath, rawContent => {
    const content = typeof rawContent === 'string'
      ? rawContent
      : rawContent.toString()
    const contentObj = JSON.parse(content) as Record<string, string>
    delete contentObj.name
    const newContentObj = {
      name: projectName,
      ...contentObj
    }
    return `${JSON.stringify(newContentObj, null, 2)}\n`
  }, { encoding: 'utf-8' })

  // Rename project
  await fs.rename(targetPath, path.join(CWD, projectName))
  
  // Install deps
  const npmISubprocess = spawn(`cd ${targetPath} && npm i`, { stdio: 'inherit', shell: true })
  await new Promise((resolve, reject) => {
    npmISubprocess.on('exit', () => resolve(true))
    npmISubprocess.on('error', () => reject(false))
  })
}
