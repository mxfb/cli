import process from 'node:process'
import url from 'node:url'
import path from 'node:path'
import { program } from 'commander'
import simpleGit from 'simple-git'
import prompts from 'prompts'
import listSubpaths from '@mxfb/tools/utils/node/list-subpaths/index.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CWD = process.cwd()

program
  .name('@mxfb/gh-pages')
  .description('A simplified process to GitHub Pages publication')
  .action(async () => {
    const git = simpleGit(CWD)
    const status = await git.status()
    if (status.current !== 'master') {
      console.error('Not on master branch.')
      return process.exit(1)
    }
    if (!status.isClean()) {
      console.error('Working directory is not clean.')
      return process.exit(1)
    }
    await git.fetch('origin')
    if (status.behind > 0) {
      console.error('Local branch is behind the remote branch.');
      return process.exit(1);
    }
    const subDirectories = await listSubpaths(CWD, {
      files: false,
      hidden: false,
      symlinks: false,
      directories: true,
      maxDepth: 0
    })
    const { sourceDirectoryPath } = await prompts({
      name: 'sourceDirectoryPath',
      type: 'select',
      message: 'Encule',
      choices: subDirectories.map(subDirPath => {
        return { title: path.relative(CWD, subDirPath), value: subDirPath }
      })
    })
    console.log('Source:', sourceDirectoryPath)
  })

program.parse(process.argv)
