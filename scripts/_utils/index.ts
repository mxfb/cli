import path from 'node:path'

import listSubpaths from '@design-edito/tools/utils/node/list-subpaths'

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

export function isInDirectory (childPath: string, parentPath: string) {
  const rel = path.relative(parentPath, childPath)
  return rel !== '' && !rel.startsWith('..')
}

export function findFirstDuplicate<T> (arr: T[]) {
  const seen = new Set<T>()
  for (const item of arr) {
    if (seen.has(item)) return item
    seen.add(item)
  }
  return null
}
