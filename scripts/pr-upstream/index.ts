import process from 'node:process'
import path from 'node:path'
import readWriteFile from '@design-edito/tools/utils/node/read-write-file/index.js'

import simpleGit from 'simple-git'
const git = simpleGit()

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

const gitignorePath = path.join(process.cwd(), '.gitignore')
const gitignoreAddition = `# NPM RUN PR-UPSTREAM
.gitignore
/src/tumblr-crawler/
/scripts/pr-upstream/
# END NPM RUN PR-UPSTREAM`
await readWriteFile(gitignorePath, content => {
  if (typeof content === 'string') return gitignoreAddition + content
  return gitignoreAddition + content.toString('utf-8')
}, { encoding: 'utf-8' })

console.log("so you wanna pr upstream ?")


