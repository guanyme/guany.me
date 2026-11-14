import { execFileSync } from 'node:child_process'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const content = fileURLToPath(new URL('content/', root))

const files = readdirSync(content, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name))
  .map((entry) => join(entry.parentPath, entry.name))

const timestamps = Object.fromEntries(
  files.sort().map((path) => {
    const key = relative(content, path).replaceAll('\\', '/')
    const timestamp =
      execFileSync('git', ['log', '-1', '--follow', '--format=%cI', '--', `content/${key}`], {
        cwd: root,
        encoding: 'utf8',
      }).trim() || statSync(path).mtime.toISOString()

    return [key, timestamp]
  }),
)

writeFileSync(join(content, 'timestamps.json'), JSON.stringify(timestamps, null, 2) + '\n')
