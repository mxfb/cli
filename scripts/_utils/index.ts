import { promises as fs, existsSync } from 'node:fs'
import path from 'node:path'

export async function listSubdirectoriesIndexes (root: string, extensions?: string[]): Promise<string[]> {
  if (!existsSync(root)) return []
  const rootStat = await fs.stat(root)
  const rootIsDir = rootStat.isDirectory()
  if (!rootIsDir) return []
  const rootChildren = (await fs.readdir(root)).map(name => path.join(root, name))
  const subdirectoriesIndexes = (await Promise.all(rootChildren.map(async filePath => {
    try {
      if (!existsSync(filePath)) return false
      const stat = await fs.stat(filePath)
      const isDirectory = stat.isDirectory()
      if (!isDirectory) return undefined
      const children = await fs.readdir(filePath)
      const foundIndex = children.find(childName => {
        const extension = path.extname(childName).toLowerCase()
        const baseName = path.basename(childName, extension)
        const extensionIsValid = extensions !== undefined ? extensions.includes(extension) : true
        if (baseName === 'index' && extensionIsValid) return true
        return false
      })
      if (foundIndex === undefined) return false
      return path.join(filePath, foundIndex)
    } catch (err) {
      return undefined
    }
  }))).filter((e): e is string => e !== undefined)
  return subdirectoriesIndexes
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
