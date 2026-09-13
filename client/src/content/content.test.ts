import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { expect, test } from 'vitest'
import { course } from './manifest'
import { validateContent, type ContentFile } from './validate'

const DIAGRAM_IDS = ['slices-backing-array'] // Task 12 replaces this with the registry export
const contentRoot = resolve(import.meta.dirname, '../../../content')

function readMarkdownFiles(dir: string): ContentFile[] {
  const out: ContentFile[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...readMarkdownFiles(full))
    else if (name.endsWith('.md')) out.push({ path: relative(contentRoot, full), text: readFileSync(full, 'utf8') })
  }
  return out
}

test('all course content is valid', () => {
  const issues = validateContent(course, readMarkdownFiles(contentRoot), DIAGRAM_IDS)
  expect(issues.map((i) => `${i.file}: ${i.message}`)).toEqual([])
})
