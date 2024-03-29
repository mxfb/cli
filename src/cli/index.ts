import process from 'node:process'
import { promises as fs } from 'node:fs'

console.log(process.argv)

const firstFlag = process.argv.at(2)?.trim()
if (firstFlag === '--list') {
  console.log('I should list !')
  // const commands = await fs.readFile()
}
