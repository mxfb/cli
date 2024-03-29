import process from 'node:process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import readWriteFile from '@mxfb/tools/utils/node/read-write-file/index.js'

const [_nodeBinPath, selfPath, assetsDirPath] = process.argv
if (assetsDirPath === undefined) {
  console.error('Could not find the assets dir path from', selfPath)
  process.exit(1)
}

const indexHtmlPath = path.join(assetsDirPath, 'index.html')
if (!existsSync(indexHtmlPath)) {
  console.error('Could not find', indexHtmlPath)
  console.error('Skipping build')
  process.exit(1)
}

await readWriteFile(indexHtmlPath, content => {
  if (typeof content === 'string') return [...content].reverse().join('')
  else return [...content.toString('utf-8')].reverse().join('')
}, { encoding: 'utf-8' })
