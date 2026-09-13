// Creates a "coming soon" markdown file for every manifest lesson whose file
// does not exist yet. Idempotent: existing files are never touched.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseCourse } from '../src/content/manifest'

const contentRoot = resolve(import.meta.dirname, '../../content')
const course = parseCourse(JSON.parse(readFileSync(resolve(contentRoot, 'course.json'), 'utf8')))

let created = 0
for (const part of course.parts)
  for (const chapter of part.chapters)
    for (const lesson of chapter.lessons) {
      const target = resolve(contentRoot, lesson.file)
      if (existsSync(target)) continue
      mkdirSync(dirname(target), { recursive: true })
      const heading = lesson.number ? `${lesson.number} ${lesson.title}` : lesson.title
      writeFileSync(
        target,
        `# ${heading}\n\n> **Coming soon.** This lesson is planned but not written yet.\n>\n> Meanwhile, read the source material: <${lesson.ref}>\n`,
      )
      created++
      console.log('created', lesson.file)
    }
console.log(`${created} stub(s) created`)
