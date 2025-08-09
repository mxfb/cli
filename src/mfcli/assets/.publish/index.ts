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

/* * * * * * * * * * * * * * * * * *
 *
 * Update cli/assets/version.txt (see .build)
 *
 * * * * * * * * * * * * * * * * * */

const pkgJsonPath = path.join(assetsDirPath, '../../../package.json')
const pkgJsonContent = await fs.readFile(pkgJsonPath, { encoding: 'utf-8' })
const pkgJsonObj = JSON.parse(pkgJsonContent)
const { version } = pkgJsonObj
const versonFileOutputPath = path.join(assetsDirPath, 'version.txt')
await fs.writeFile(versonFileOutputPath, `${version}`, { encoding: 'utf-8' })
