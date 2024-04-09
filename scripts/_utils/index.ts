import path from 'node:path'
import listSubpaths from '@design-edito/tools/utils/node/list-subpaths/index.js'
import isInDirectory from '@design-edito/tools/utils/node/is-in-directory/index.js'
import findDuplicatesInArray from '@design-edito/tools/utils/agnostic/find-duplicates-in-array/index.js'

export async function listSubdirectoriesIndexes (root: string, extensions?: string[]): Promise<string[]> {
  return await listSubpaths(root, {
    directories: false,
    symlinks: false,
    hidden: false,
    maxDepth: 1,
    filter: (filePath, { type }) => {
      if (type !== 'file') return false
      const extension = path.extname(filePath)
      const basename = path.basename(filePath, extension)
      const extensionIsValid = extensions?.includes(extension) ?? true
      return basename === 'index' && extensionIsValid
    }
  })
}
