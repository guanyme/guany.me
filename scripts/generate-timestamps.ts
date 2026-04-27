import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const contentDir = path.join(process.cwd(), 'content')
const outputPath = path.join(process.cwd(), 'content', 'timestamps.json')

function getAllFiles(dir: string): string[] {
  const files: string[] = []
  if (!fs.existsSync(dir)) return files

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath))
    } else if (entry.name.match(/\.mdx?$/)) {
      files.push(fullPath)
    }
  }
  return files
}

const files = getAllFiles(contentDir)
const timestamps: Record<string, string> = {}

for (const filePath of files) {
  const relativePath = path.relative(contentDir, filePath)
  const gitPath = path.relative(process.cwd(), filePath)
  try {
    const result = execSync(
      `git log -1 --follow --format=%cI -- "${gitPath}"`,
      {
        encoding: 'utf8',
      },
    ).trim()
    if (result) {
      timestamps[relativePath] = result
    } else {
      timestamps[relativePath] = fs.statSync(filePath).mtime.toISOString()
    }
  } catch {
    timestamps[relativePath] = fs.statSync(filePath).mtime.toISOString()
  }
}

fs.writeFileSync(outputPath, JSON.stringify(timestamps, null, 2) + '\n')
console.log(`Generated timestamps for ${Object.keys(timestamps).length} files`)
