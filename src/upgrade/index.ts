import { spawn } from 'node:child_process'
import process from 'node:process'
import { program } from 'commander'
import prompts from 'prompts'
import { Logs } from '@design-edito/tools/agnostic/misc/logs/index.js'

const logged = {
  title: Logs.styles.title('Global upgrade of @design-edito/cli'),
  installed: Logs.styles.info('\nCurrently installed NPM packages:\n'),
  listError: Logs.styles.error('\nSomething went wrong while listing the globally installed NPM packages. Aborting.'),
  confirm: 'You may be prompted for your sudo password to complete the installation. Do you want to continue?',
  aborting: Logs.styles.error('\nAborting.'),
  installing: Logs.styles.important('Installing @design-edito/cli globally...\n'),
  success: Logs.styles.success('\nSuccess.\n'),
  installationError: Logs.styles.error('\nInstallation failed. Please check your permissions and try again.\n')
}

program
  .name('@design-edito/upgrade')
  .description('Upgrades @design-edito/cli to the latest version available')
  .action(async () => {
    console.log(logged.title)
    console.log(logged.installed)
    const child1 = spawn('npm', ['list', '-g'], { stdio: 'inherit' })
    child1.on('exit', async code => {
      if (code !== 0) {
        console.log(logged.listError)
        return process.exit(code)
      }
      const { proceedUpgrade } = await prompts({
        name: 'proceedUpgrade',
        type: 'confirm',
        message: logged.confirm
      })
      if (proceedUpgrade !== true) {
        console.log(logged.aborting)
        return process.exit(1)
      }
      console.log('')
      const child2 = spawn('sudo', ['npm', 'i', '-g', '@design-edito/cli'], { stdio: 'inherit' })
      console.log(logged.installing)
      child2.on('exit', code => {
        if (code === 0) console.log(logged.success)
        else {
          console.error(logged.installationError)
          process.exit(code) 
        }
      })
    })
  })

program.parse(process.argv)
