import process from 'node:process'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const [_nodeBinPath, selfPath, assetsDirPath] = process.argv
if (selfPath === undefined) {
  console.error('Fatal: Self path not provided to builder script')
  process.exit(1)
}
if (assetsDirPath === undefined) {
  console.error('Fatal: Could not find the assets dir path from', selfPath)
  process.exit(1)
}

const buildFolderPath = path.join(assetsDirPath, '../..')
const commands = await fs.readdir(buildFolderPath)
const outputPath = path.join(selfPath, '../list.txt')
await fs.writeFile(outputPath, commands.join('\n'), { encoding: 'utf-8' })
