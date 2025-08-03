import { spawn } from 'child_process'
import { program } from 'commander'

program
  .name('@design-edito/push')
  .description('Shorthand for git push with arguments forwarding')
  .allowUnknownOption(true)
  .arguments('[args...]')
  .action((args: string[]) => {
    spawn(
      'git',
      ['-c', 'color.ui=always', 'push', ...args],
      { stdio: 'inherit' }
    ).on('exit', code => process.exit(code ?? 0))
  })

program.parse(process.argv)
