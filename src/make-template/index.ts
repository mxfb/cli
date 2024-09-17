import process from 'node:process'
import { promises as fs, existsSync } from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { program } from 'commander'
import prompts from 'prompts'
import { Files } from '@design-edito/tools/node/files/index.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CWD = process.cwd()

program
  .name('@design-edito/make-template')
  .description('Generate in cwd a project template')

program
  .command('express')
  .description('make express.js + typescript project structure')
  .action(makeExpress)

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
  const reactTemplatePath = path.join(__dirname, 'assets/react')
  if (!existsSync(reactTemplatePath)) {
    console.error(`Could not find the template to copy at ${reactTemplatePath}`)
    return process.exit(1)
  }
  const defaultTargetPath = path.join(CWD, 'react-template')
  
  // Copy
  await fs.cp(reactTemplatePath, defaultTargetPath, { recursive: true })
  const { projectName } = await prompts({
    name: 'projectName',
    message: 'Project name ? (for package.json name field)',
    type: 'text'
  })
  
  // Custom project name
  const packageJsonPath = path.join(defaultTargetPath, 'package.json')
  await Files.readWrite(packageJsonPath, rawContent => {
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
  
  // Install deps
  const npmISubprocess = spawn(`cd ${defaultTargetPath} && npm i`, { stdio: 'inherit', shell: true })
  await new Promise((resolve, reject) => {
    npmISubprocess.on('exit', () => resolve(true))
    npmISubprocess.on('error', () => reject(false))
  })

  // Rename project
  const targetPath = path.join(CWD, projectName)
  await fs.rename(defaultTargetPath, targetPath)

  // Rename gitignore
  await fs.rename(
    path.join(targetPath, 'gitignore'),
    path.join(targetPath, '.gitignore')
  )
}

async function makeExpress () {
  const expressTemplatePath = path.join(__dirname, 'assets/express')
  if (!existsSync(expressTemplatePath)) {
    console.error(`Could not find the template to copy at ${expressTemplatePath}`)
    return process.exit(1)
  }
  const defaultTargetPath = path.join(CWD, 'express-template')
  
  // Copy
  await fs.cp(expressTemplatePath, defaultTargetPath, { recursive: true })
  const { projectName } = await prompts({
    name: 'projectName',
    message: 'Project name ? (for package.json name field)',
    type: 'text'
  })
  
  // Custom project name in package.json
  const packageJsonPath = path.join(defaultTargetPath, 'package.json')
  await Files.readWrite(packageJsonPath, rawContent => {
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

  // Custom project name in src/bin/start.ts
  const binStartTsPath = path.join(defaultTargetPath, 'src/bin/start.ts')
  await Files.readWrite(binStartTsPath, rawContent => {
    const originalContent = typeof rawContent === 'string'
      ? rawContent
      : rawContent.toString()
    const updatedContent = originalContent.replace('<<@mxfb/cli----replace-with-name>>', projectName)
    return updatedContent
  }, { encoding: 'utf-8' })
  
  // Install deps
  const npmISubprocess = spawn(`cd ${defaultTargetPath} && npm i`, { stdio: 'inherit', shell: true })
  await new Promise((resolve, reject) => {
    npmISubprocess.on('exit', () => resolve(true))
    npmISubprocess.on('error', () => reject(false))
  })

  // Rename project
  const targetPath = path.join(CWD, projectName)
  await fs.rename(defaultTargetPath, targetPath)

  // Rename gitignore
  await fs.rename(
    path.join(targetPath, 'gitignore'),
    path.join(targetPath, '.gitignore')
  )
}
