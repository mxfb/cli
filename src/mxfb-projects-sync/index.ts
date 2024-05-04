import process from 'node:process'
import url from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { program } from 'commander'
import prompts from 'prompts'
import { getConfig, updateConfig } from '@mxfb/tools/utils/node/mxfb-cli-config/index.js'
import { spawn } from 'node:child_process'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CWD = process.cwd()

program
  .name('@mxfb/mxfb-projects-sync')
  .description('Keep in sync the different git repos for mxfb/tools & mxfb/cli')
  .argument('[lmpath]', 'Path for Le Monde folder')
  .argument('[mxfbpath]', 'Path for Mxfb folder')
  .action(async (_lmpath, _mxfbpath, options) => {
    const config = await getConfig(true)
    if (config instanceof Error) throw config
    const { mxfb_projects_sync: {
      lm_path: configLmPath,
      mxfb_path: configMxfbPath
    } = {} } = config
    
    let lmPath: string = ''
    if (_lmpath !== undefined) { lmPath = resolveHome(`${_lmpath}`) }
    else {
      const { promptsLmPath } = await prompts({
        type: 'text',
        name: 'promptsLmPath',
        message: `Path to Le Monde directory (absolute or relative to ${CWD})`,
        initial: configLmPath ?? ''
      })
      lmPath = resolveHome(`${promptsLmPath}`)
    }
    
    let mxfbPath: string = ''
    if (_mxfbpath !== undefined) { mxfbPath = resolveHome(`${_mxfbpath}`) }
    else {
      const { promptsMxfbPath } = await prompts({
        type: 'text',
        name: 'promptsMxfbPath',
        message: `Path to Mxfb directory (absolute or relative to ${CWD})`,
        initial: configMxfbPath ?? ''
      })
      mxfbPath = resolveHome(`${promptsMxfbPath}`)
    }

    console.log('Le Monde:', lmPath)
    console.log('Mxfb:    ', mxfbPath)
    const { pathsAreOk } = await prompts({
      type: 'confirm',
      name: 'pathsAreOk',
      message: 'Continue using those paths?'
    })
    if (pathsAreOk !== true) {
      console.log('\nBye.\n')
      process.exit(0)
    }
    if (lmPath !== configLmPath || mxfbPath !== configMxfbPath) {
      const { savePaths } = await prompts({
        type: 'confirm',
        name: 'savePaths',
        message: 'Do you want to save those paths for the next time ?'
      })
      if (savePaths === true) {
        const updated = await updateConfig(curr => ({
          ...curr,
          mxfb_projects_sync: {
            lm_path: lmPath,
            mxfb_path: mxfbPath
          }
        }), true)
        if (updated instanceof Error) throw updated
        console.log('Saved.')
      }
    }
    
    const shellScriptExecution = spawn('sh', [path.join(__dirname, './assets/main.sh'), lmPath, mxfbPath], { stdio: 'inherit' })
    shellScriptExecution.on('error', err => console.error(`Error: ${err.message}`))
    shellScriptExecution.on('close', code => console.error(`main.sh exited with code ${code}`))
  })

program.parse(process.argv)

function resolveHome (filePath: string) {
  if (filePath.startsWith('~/')) return path.join(os.homedir(), filePath.slice(2))
  return filePath
}

