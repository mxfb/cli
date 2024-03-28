import process from 'node:process'
import path from 'node:path'

// ROOT
export const CWD = process.cwd()
export const PKG_JSON = path.join(CWD, 'package.json')
export const BUILD = path.join(CWD, 'build')
export const SRC = path.join(CWD, 'src')

// build
export const BUILD_PKG_JSON = path.join(BUILD, 'package.json')
