import { exec } from 'child_process'
import { program } from 'commander'

program
  .name('@design-edito/add')
  .description('Shorthand for git add with arguments forwarding (defaults to "*")')
  .allowUnknownOption(true)
  .arguments('[args...]')
  .action((args: string[]) => {
    const finalArgs = args.length > 0 ? args.join(' ') : '.*'
    exec(`git add ${finalArgs}`, (error, stdout, stderr) => {
      if (error) console.log('\nERR\n', error)
      if (stderr) console.log('\nstderr:\n', stderr)
      if (stdout) console.log('\nstdout:\n', stdout)
    })
  })

program.parse(process.argv)
