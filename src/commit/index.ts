import { exec } from 'child_process'
import { program } from 'commander'

program
  .name('@design-edito/commit')
  .description('Shorthand for git commit -m "<message>"')
  .argument('<message>', 'Commit message')
  .action(async message => {
    exec(`git commit -m "${message}"`, (error, stdout, stderr) => {
      if (error) console.log('\nERR\n', error)
      if (stderr) console.log('\nstderr:\n', stderr)
      if (stdout) console.log('\nstdout:\n', stdout)
    })
  })

program.parse(process.argv)
