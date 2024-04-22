import process from 'node:process'
import url from 'node:url'
import path from 'node:path'
import { promises as fs, rmdirSync, rmSync } from 'node:fs'
import { program } from 'commander'
import simpleGit from 'simple-git'
import prompts from 'prompts'
import listSubpaths from '@mxfb/tools/utils/node/list-subpaths/index.js'
import * as processExit from '@mxfb/tools/utils/node/process-exit/index.js'
import { randomHash } from '@mxfb/tools/utils/agnostic/random-uuid/index.js'
import wait from '@mxfb/tools/utils/agnostic/wait/index.js'
import isInDirectory from '@mxfb/tools/utils/node/is-in-directory/index.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CWD = process.cwd()

program
  .name('@mxfb/gh-pages')
  .description('A simplified process to GitHub Pages publication')
  .action(async () => {
    // Check current git status
    const git = simpleGit(CWD)
    const initStatus = await git.status()
    const initBranch = initStatus.current
    if (initBranch !== 'master') {
      console.error('Not on master branch.')
      return process.exit(1)
    }
    if (!initStatus.isClean()) {
      console.error('Working directory is not clean.')
      return process.exit(1)
    }
    await git.fetch('origin')
    if (initStatus.behind > 0) {
      console.error('Local branch is behind the remote branch.');
      return process.exit(1);
    }

    // CWD contents backup
    const TMPCWDCOPY = path.join(__dirname, `temp.cwd.${randomHash(8)}`)
    if (isInDirectory(CWD, TMPCWDCOPY)
      || isInDirectory(TMPCWDCOPY, CWD)) {
      console.error('Invalid source directory path (cannot be inside this bin files path)')
      return process.exit(1)
    }
    const deleteTempCwdCopy = async () => {
      try { rmSync(TMPCWDCOPY, { recursive: true, force: true }) }
      catch (err) {}
    }
    processExit.anyway(deleteTempCwdCopy)
    await fs.cp(CWD, TMPCWDCOPY, { recursive: true, force: true })

    // Select source directory
    const initCwdSubdirectories = await listSubpaths(CWD, {
      files: false,
      hidden: false,
      symlinks: false,
      directories: true,
      maxDepth: 0
    })
    const { SRC } = await prompts({
      name: 'SRC',
      type: 'select',
      message: 'What directory do you want to expose ?',
      choices: [CWD, ...initCwdSubdirectories].map(subDirPath => {
        const displayPath = path.relative(path.dirname(CWD), subDirPath)
        return { title: displayPath, value: subDirPath }
      })
    })
    const TMPSRCCOPY = path.join(__dirname, `temp.source.${randomHash(8)}`)
    if (isInDirectory(SRC, TMPSRCCOPY)
      || isInDirectory(TMPSRCCOPY, SRC)) {
      console.error('Invalid source directory path (cannot be inside this bin files path)')
      return process.exit(1)
    }

    // Copy source directory to a temp dir
    const deleteTempSrcCopy = async () => {
      try { rmSync(TMPSRCCOPY, { recursive: true, force: true }) }
      catch (err) {}
    }
    processExit.anyway(deleteTempSrcCopy)
    await fs.mkdir(TMPSRCCOPY, { recursive: true })
    await fs.cp(SRC, TMPSRCCOPY, { recursive: true, force: true })
    
    // Select target branch and public directory
    const { targetBranchName, targetDirectoryName } = await prompts([{
      type: 'text',
      name: 'targetBranchName',
      message: 'Type the name of the public branch'
    }, {
      type: 'text',
      name: 'targetDirectoryName',
      message: 'Type the name of the public directory',      
    }])

    if (typeof targetDirectoryName !== 'string' || targetDirectoryName === '') {
      console.error('You must specify a target directory name.')
      return process.exit(1)
    }

    // Go to public branch, make a backup of target
    try {
      await git.checkout(targetBranchName)
    } catch (err) {
      console.error(err)
      return process.exit(1)
    }
    const DEST = path.join(CWD, targetDirectoryName)
    try {
      await fs.access(DEST)
    } catch (err) {
      await fs.mkdir(DEST, { recursive: true })
    }
    const DESTBACKUP = path.join(__dirname, `temp.dest.${randomHash(8)}`)
    const deleteTempDestBackup = () => {
      try { rmSync(DESTBACKUP, { recursive: true, force: true }) }
      catch (err) {}
    }
    processExit.anyway(deleteTempDestBackup)
    if (isInDirectory(CWD, DESTBACKUP) || isInDirectory(DESTBACKUP, CWD)) {
      console.error('Invalid source directory path (cannot be inside this bin files path)')
      return process.exit(1)
    }
    try {
      await fs.cp(`${DEST}/`, `${DESTBACKUP}/`, { recursive: true, force: true })
    } catch (err) {
      console.error(err)
      return process.exit(1)
    }

    // Remove everything inside public branch's target directory
    const targetDirectorySubpaths = await listSubpaths(DEST, {
      hidden: true,
      maxDepth: 0
    })
    const afterCheckoutStatus = await git.status()
    const currentBranchName = afterCheckoutStatus.current
    if (currentBranchName === null || currentBranchName !== targetBranchName) {
      console.error(`Something went wrong, target branch name is: '${targetBranchName}' but current is ${currentBranchName}`)
      return process.exit(1)
    }
    const { confirmProject, confirmBranch } = await prompts([{
      type: 'confirm',
      name: 'confirmProject',
      message: `You are about to perform a descrutive operation inside ${CWD}. Continue ?`
    }, {
      type: 'confirm',
      name: 'confirmBranch',
      message: `The current branch of the project is '${currentBranchName}'. Continue ?`
    }])
    if (confirmProject !== true || confirmBranch !== true) return process.exit(1)
    console.log('Current members of', DEST)
    targetDirectorySubpaths.forEach(subPath => console.log(subPath))
    const { confirmDeleteCwd } = await prompts([{
        type: 'confirm',
        name: 'confirmDeleteCwd',
        message: 'Are you sure you want to delete all these files and their contents ?'
    }])
    if (confirmDeleteCwd !== true) return process.exit(1)
    for (const path of targetDirectorySubpaths) await fs.rm(path, { recursive: true, force: true })
    await fs.cp(`${TMPSRCCOPY}/`, `${DEST}/`, { recursive: true })
    console.log('Files copied in branch', currentBranchName, 'to', DEST)
    
    deleteTempSrcCopy()

    // Add, commit, push
    const { publishReady } = await prompts([{
      type: 'confirm',
      name: 'publishReady',
      message: 'Final call, ready to publish ?'
    }])
    if (publishReady !== true) return process.exit(1)
    const { commitMessage } = await prompts([{
      type: 'text',
      name: 'commitMessage',
      message: 'Type a message associated to the publication commit'
    }])
    await git.add('.')
    await git.commit(typeof commitMessage === 'string' ? commitMessage : '')
    await git.push('origin', currentBranchName)
    await git.checkout('master')

    const finalCwdSubpaths = await listSubpaths(CWD, {
      hidden: true,
      maxDepth: 0
    })
    for (const finalCwdSubpath of finalCwdSubpaths) await fs.rm(finalCwdSubpath, { recursive: true, force: true })
    await fs.cp(`${TMPCWDCOPY}/`, `${CWD}/`, { recursive: true })

    deleteTempDestBackup()
    deleteTempCwdCopy()
    return process.exit(0)
  })

program.parse(process.argv)
