import process from 'node:process'
import { promises as fs } from 'node:fs'
import url from 'node:url'
import path from 'node:path'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const firstFlag = process.argv.at(2)?.trim()
if (firstFlag === '--list') {
  const listFilePath = path.join(__dirname, 'assets/list.txt')
  const list = await fs.readFile(listFilePath, { encoding: 'utf-8' })
  console.log(list)
  process.exit(0)
}
