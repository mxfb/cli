import { exec } from 'child_process'
import { program } from 'commander'

program
  .name('@design-edito/reset')
  .description('Shorthand for git reset with arguments forwarding')
  .allowUnknownOption(true)
  .arguments('[args...]')
  .action((args: string[]) => {
    const cmd = `git reset ${args.join(' ')}`

    exec(cmd, (error, stdout, stderr) => {
      if (error) console.log('\nERR\n', error)
      if (stderr) console.log('\nstderr:\n', stderr)
      if (stdout) console.log('\nstdout:\n', stdout)
    })
  })

program.parse(process.argv)
