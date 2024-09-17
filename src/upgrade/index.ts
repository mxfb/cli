import { spawn } from 'node:child_process'
import process from 'node:process'
import { program } from 'commander'
import prompts from 'prompts'
import { Logs } from '@design-edito/tools/agnostic/misc/logs/index.js'

program
  .name('@design-edito/upgrade')
  .description('Upgrades @design-edito/cli to the latest version available')
  .action(async () => {
    console.log(Logs.styles.title('Global upgrade of @design-edito/cli'))
    console.log(Logs.styles.info('\nCurrently installed NPM packages:\n'))
    const child1 = spawn('npm', ['list', '-g'], { stdio: 'inherit' })
    child1.on('exit', async code => {
      if (code !== 0) {
        console.log(Logs.styles.error('\nSomething went wrong while listing the globally installed NPM packages. Aborting.'))
        return process.exit(code)
      }
      const { proceedUpgrade } = await prompts({
        name: 'proceedUpgrade',
        type: 'confirm',
        message: 'You may be prompted for your sudo password to complete the installation. Do you want to continue?'
      })
      if (proceedUpgrade !== true) {
        console.log(Logs.styles.error('\nAborting.'))
        return process.exit(1)
      }
      console.log('')
      const child2 = spawn('sudo', ['npm', 'i', '-g', '@design-edito/cli'], { stdio: 'inherit' })
      console.log(Logs.styles.important('Installing @design-edito/cli globally...\n'))
      child2.on('exit', code => {
        if (code === 0) console.log(Logs.styles.success('\n@design-edito/cli has been successfully installed globally.\n'))
        else {
          console.error(Logs.styles.error('\nInstallation failed. Please check your permissions and try again.\n'))
          process.exit(code) 
        }
      })
    })
  })

program.parse(process.argv)
