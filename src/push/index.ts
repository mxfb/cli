import { exec } from 'child_process'
import { program } from 'commander'

program
  .name('@design-edito/push')
  .description('Shorthand for git push with arguments forwarding')
  .allowUnknownOption(true)
  .arguments('[args...]')
  .action((args: string[]) => {
    exec(`git push ${args.join(' ')}`, (error, stdout, stderr) => {
      if (error) console.log('\nERR\n', error)
      if (stderr) console.log('\nstderr:\n', stderr)
      if (stdout) console.log('\nstdout:\n', stdout)
    })
  })

program.parse(process.argv)
