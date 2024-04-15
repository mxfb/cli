import process from 'node:process'
import path from 'node:path'
import readWriteFile from '@design-edito/tools/utils/node/read-write-file/index.js'

import simpleGit from 'simple-git'
import { spawn } from 'node:child_process'
const git = simpleGit()

// Check git status

const status = await git.status()

if (status.current !== 'master') {
  console.error('You are not in the master branch')
  process.exit(1)
}

if (status.files.length > 0) {
  console.error('You have uncommited changes.')
  process.exit(1)
}

if (status.not_added.length > 0) {
  console.error('You have untracked files.')
  process.exit(1)
}

// Edit .gitignore

const gitignorePath = path.join(process.cwd(), '.gitignore')
const gitignoreAddition = `# NPM RUN PR-UPSTREAM
.gitignore
/src/tumblr-crawler/
/scripts/pr-upstream/
# END NPM RUN PR-UPSTREAM\n`

await readWriteFile(gitignorePath, content => {
  if (typeof content === 'string') return gitignoreAddition + content
  return gitignoreAddition + content.toString('utf-8')
}, { encoding: 'utf-8' })

// Make pull request

await new Promise((resolve, reject) => {
  const prProcess = spawn('gh', ['pr', 'create', '--repo', 'lm-design-edito/lm-cli', '--fill'], { stdio: 'inherit' })
  prProcess.on('close', code => {
    if (code === 0) {
      console.log('Pull request created')
      return resolve(true)
    }
    console.error(`Error while creating pull request (code: ${code})`)
    return reject(code)
  })
})

// Reset .gitignore

await readWriteFile(gitignorePath, content => {
  if (typeof content === 'string') return content.split(gitignoreAddition).join('')
  return content.toString('utf-8').split(gitignoreAddition).join('')
}, { encoding: 'utf-8' })
