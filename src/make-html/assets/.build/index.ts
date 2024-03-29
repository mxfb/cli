import process from 'node:process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const [_nodePath, _scriptPath, assetsDirPath] = process.argv
const __filename = url.fileURLToPath(import.meta.url)
if (assetsDirPath === undefined) {
  console.error('Fatal: Could not find the assets dir path from', __filename)
  process.exit(1)
}

const buildFolderPath = path.join(assetsDirPath, '../..')
const commands = (await fs.readdir(buildFolderPath)).filter(e => e !== 'package.json').sort()
const outputPath = path.join(assetsDirPath, 'list.txt')
await fs.writeFile(outputPath, commands.join('\n'), { encoding: 'utf-8' })
