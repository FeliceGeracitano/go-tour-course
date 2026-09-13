// Verify self-contained Go examples directly from the lesson sources.
import { readFile, mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, sep } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import yaml from 'js-yaml'

const exec = promisify(execFile)
const root = resolve(import.meta.dirname, '../../content')
const course = JSON.parse(await readFile(join(root, 'course.json'), 'utf8'))
const lessons = course.parts.flatMap(p => p.chapters.flatMap(c => c.lessons))
const fixtures = JSON.parse(await readFile(join(root, 'example-fixtures.json'), 'utf8'))
const examples = []
const excerpts = []
const race = process.argv.includes('--race')
for (const lesson of lessons) {
  const tree = unified().use(remarkParse).parse(await readFile(join(root, lesson.file), 'utf8'))
  function visit(node) {
    if (node.type === 'code') {
      let code = node.lang === 'go' ? node.value : node.lang === 'annotate' ? yaml.load(node.value).code : ''
      // Prediction questions in this course either contain a full main or a function-body fragment.
      let expected
      if (node.lang === 'quiz') {
        const quiz = yaml.load(node.value)
        if (quiz.type === 'predict') {
          code = quiz.code
          if (!/^package main\b/.test(code)) {
            if (!/^func main\(/m.test(code)) code = `func main() {\n${code}\n}`
            code = `package main\nimport "fmt"\n${code}`
          }
          expected = quiz.options[quiz.answer].replaceAll(' then ', '\n')
        }
      }
      // Other fragments and deliberately invalid line-selection questions are not executed.
      if (/^package main\b/.test(code)) {
        if (/"example\.com\//.test(code) && !fixtures[lesson.file]) excerpts.push(lesson.file)
        else examples.push({ file: lesson.file, line: node.position.start.line, code, expected })
      }
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(tree)
}
if (examples.length === 0) throw new Error('No standalone Go examples found')
const workspace = await mkdtemp(join(tmpdir(), 'go-course-examples-'))
let next = 0
let checked = 0
const failures = []
try {
  // One pinned dependency is used by the errgroup lesson; other examples use stdlib.
  await writeFile(join(workspace, 'go.mod'), 'module course-examples\n\ngo 1.25.0\n\nrequire golang.org/x/sync v0.16.0\n')
  await exec('go', ['mod', 'download', 'golang.org/x/sync'], { cwd: workspace, timeout: 120000 })
  async function worker() {
    while (next < examples.length) {
      const index = next++
      const { file, line, code, expected: prediction } = examples[index]
      const dir = await mkdtemp(join(workspace, 'example-'))
      const isTest = /^func (?:Test|Benchmark|Fuzz)\w*\(/m.test(code)
      const source = join(dir, isTest ? 'example_test.go' : 'main.go')
      await writeFile(source, code)
      for (const [name, contents] of Object.entries(fixtures[file] ?? {})) {
        const path = resolve(dir, name)
        if (!path.startsWith(dir + sep)) throw new Error(`Fixture path escapes example: ${name}`)
        await mkdir(dirname(path), { recursive: true })
        await writeFile(path, contents)
      }
      try {
        if (isTest) {
          await exec('go', ['test', ...(race ? ['-race'] : []), '-count=1', '-timeout=15s', '.'], { cwd: dir, timeout: 120000 })
        } else {
          const binary = join(dir, 'example')
          await exec('go', ['build', ...(race ? ['-race'] : []), '-o', binary, '.'], { cwd: dir, timeout: 120000 })
          const output = code.match(/\n\/\/ Output:\s*\n([\s\S]*)$/)
          if (output || prediction !== undefined) {
            const expected = prediction ?? output[1].split('\n').map(s => s.replace(/^\/\/ ?/, '')).join('\n').trimEnd()
            const { stdout } = await exec(binary, [], { cwd: dir, timeout: 10000 })
            if (stdout.trimEnd() !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(stdout.trimEnd())}`)
          }
        }
        checked++
      } catch (error) {
        failures.push(`${file}:${line}: ${error.stderr || error.message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
} finally {
  await rm(workspace, { recursive: true, force: true })
}
for (const file of excerpts) console.log(`Excerpt requiring its own module setup (not executed): ${file}`)
for (const failure of failures) console.error(failure)
console.log(`${checked}/${examples.length} Go examples verified (build, prediction/declared output, or tests).`)
if (failures.length) process.exitCode = 1
