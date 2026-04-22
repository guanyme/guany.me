import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { slugify, customIdRegex } from './rehype-custom-slug'

const contentDir = path.join(process.cwd(), 'content')

export interface DocMeta {
  title?: string
  description?: string
  date?: string
  draft?: boolean
  [key: string]: unknown
}

export interface Doc {
  slug: string
  meta: DocMeta
  content: string
}

// Get all documents
export function getAllDocs(locale: string, subDir: string): Doc[] {
  const docsDir = path.join(contentDir, locale, subDir)

  if (!fs.existsSync(docsDir)) {
    return []
  }

  const files = getAllMdxFiles(docsDir)

  return files.map((filePath) => {
    const relativePath = path.relative(docsDir, filePath)
    const slug = relativePath.replace(/\.mdx?$/, '').replace(/\\/g, '/')
    const content = fs.readFileSync(filePath, 'utf8')
    const { data } = matter(content)

    return {
      slug,
      meta: data,
      content,
    }
  })
}

// Recursively get all MDX files
function getAllMdxFiles(dir: string): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath))
    } else if (entry.name.match(/\.mdx?$/)) {
      files.push(fullPath)
    }
  }

  return files
}

// Extract the first h1 heading from the content as the title
function extractTitleFromContent(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : undefined
}

// Get a single document by slug
export function getDocBySlug(
  locale: string,
  subDir: string,
  slug: string,
): Doc | null {
  const docsDir = path.join(contentDir, locale, subDir)
  const mdxPath = path.join(docsDir, `${slug}.mdx`)
  const mdPath = path.join(docsDir, `${slug}.md`)

  const filePath = fs.existsSync(mdxPath)
    ? mdxPath
    : fs.existsSync(mdPath)
      ? mdPath
      : null

  if (!filePath) {
    return null
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const { data, content: rawContent } = matter(content)

  // If there is no title in the frontmatter, extract one from the content
  const title = data.title || extractTitleFromContent(rawContent)

  return {
    slug,
    meta: { ...data, title },
    content,
  }
}

// Read the pre-generated timestamp cache
function getTimestamps(): Record<string, string> {
  const timestampsPath = path.join(contentDir, 'timestamps.json')
  try {
    return JSON.parse(fs.readFileSync(timestampsPath, 'utf8'))
  } catch {
    return {}
  }
}

// Get the document's last updated time
export function getDocLastUpdated(
  locale: string,
  slug: string,
  subDir: string = 'docs',
): string | null {
  const mdxKey = path.join(locale, subDir, `${slug}.mdx`)
  const mdKey = path.join(locale, subDir, `${slug}.md`)

  const timestamps = getTimestamps()
  return timestamps[mdxKey] ?? timestamps[mdKey] ?? null
}

// Extract the table of contents from the document content
export function extractToc(content: string) {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm
  const toc: { level: number; text: string; id: string }[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const rawText = match[2].trim()

    // Parse the {#custom-id} syntax
    const customMatch = rawText.match(customIdRegex)
    const text = customMatch ? rawText.replace(customIdRegex, '') : rawText
    const id = customMatch ? customMatch[1] : slugify(rawText)

    toc.push({ level, text, id })
  }

  return toc
}
