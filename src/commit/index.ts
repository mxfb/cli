import { spawn } from 'child_process'
import { program } from 'commander'

program
  .name('@design-edito/commit')
  .description('Shorthand for git commit -m "<message>"')
  .argument('<message>', 'Commit message')
  .action(async message => {
    spawn(
      'git',
      ['-c', 'color.ui=always', 'commit', '-m', message],
      { stdio: 'inherit' }
    ).on('exit', code => process.exit(code ?? 0))
  })

program.parse(process.argv)
