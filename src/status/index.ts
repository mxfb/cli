import { spawn } from 'child_process'
import { program } from 'commander'

program
  .name('@design-edito/status')
  .description('Shorthand for git status with arguments forwarding')
  .allowUnknownOption(true)
  .arguments('[args...]')
  .action((args: string[]) => {
    spawn(
      'git',
      ['-c', 'color.ui=always', 'status', ...args],
      { stdio: 'inherit' }
    ).on('exit', code => process.exit(code ?? 0))
  })

program.parse(process.argv)
