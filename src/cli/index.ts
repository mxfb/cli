import process from 'node:process'
import { promises as fs } from 'node:fs'
import url from 'node:url'
import path from 'node:path'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log(__filename)
console.log(__dirname)

const firstFlag = process.argv.at(2)?.trim()
if (firstFlag === '--list') {
  console.log('I should list !')
  // await fs.readFile()
  // const commands = await fs.readFile()
}
