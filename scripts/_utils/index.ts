import path from 'node:path'
import listSubpaths from '@mxfb/tools/utils/node/list-subpaths/index.js'

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
