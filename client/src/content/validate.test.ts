import { describe, expect, test } from 'vitest'
import type { Course } from './manifest'
import { validateContent, type ContentFile } from './validate'

const course: Course = {
  title: 'T',
  parts: [{ id: 'p', title: 'P', chapters: [{ id: 'c', title: 'C', lessons: [
    { id: 'a', title: 'A', file: 'p/c/a.md', ref: 'https://go.dev' },
  ] }] }],
}
const good: ContentFile = { path: 'p/c/a.md', text: '# A\n\ntext\n' }
const ids = ['slices-backing-array']

function messages(files: ContentFile[], c: Course = course) {
  return validateContent(c, files, ids).map((i) => i.message)
}

describe('manifest ↔ files', () => {
  test('clean content yields no issues', () => {
    expect(validateContent(course, [good], ids)).toEqual([])
  })
  test('missing file is reported', () => {
    expect(messages([])).toEqual([expect.stringMatching(/missing.*p\/c\/a\.md/)])
  })
  test('orphan file is reported', () => {
    expect(messages([good, { path: 'p/c/orphan.md', text: '#' }])).toEqual([expect.stringMatching(/not in manifest/)])
  })
  test('duplicate lesson id across chapters is reported', () => {
    const dup: Course = { ...course, parts: [{ id: 'p', title: 'P', chapters: [
      { id: 'c', title: 'C', lessons: [{ id: 'a', title: 'A', file: 'p/c/a.md', ref: 'https://go.dev' }] },
      { id: 'd', title: 'D', lessons: [{ id: 'a', title: 'A2', file: 'p/d/a.md', ref: 'https://go.dev' }] },
    ] }] }
    expect(messages([good, { path: 'p/d/a.md', text: '#' }], dup)).toEqual([expect.stringMatching(/duplicate lesson id "a"/)])
  })
})

describe('widget blocks', () => {
  const withBlock = (body: string, lang = 'annotate'): ContentFile => ({ path: 'p/c/a.md', text: `# A\n\n\`\`\`${lang}\n${body}\n\`\`\`\n` })

  test('schema violation names the block', () => {
    expect(messages([withBlock('code: x\nhotspots: []')])).toEqual([expect.stringMatching(/block #1 \(annotate, line 3\)/)])
  })
  test('hotspot match not on line', () => {
    expect(messages([withBlock('code: "x := 1"\nhotspots: [{ line: 1, match: "zz", title: t, note: n }]')]))
      .toEqual([expect.stringMatching(/hotspot 1: "zz" not found on line 1/)])
  })
  test('hotspot line beyond code', () => {
    expect(messages([withBlock('code: "x := 1"\nhotspots: [{ line: 4, match: "x", title: t, note: n }]')]))
      .toEqual([expect.stringMatching(/hotspot 1: line 4 beyond code \(1 lines\)/)])
  })
  test('trace step line beyond code', () => {
    expect(messages([withBlock('code: "x := 1"\nsteps: [{ line: 2, note: n }]', 'trace')]))
      .toEqual([expect.stringMatching(/step 1: line 2 beyond code/)])
  })
  test('mcq answer out of range', () => {
    expect(messages([withBlock('type: mcq\nquestion: q\noptions: [a, b]\nanswer: 2\nexplain: e', 'quiz')]))
      .toEqual([expect.stringMatching(/answer 2 out of range/)])
  })
  test('spotline answer beyond code', () => {
    expect(messages([withBlock('type: spotline\nquestion: q\ncode: "a"\nanswer: 3\nexplain: e', 'quiz')]))
      .toEqual([expect.stringMatching(/answer line 3 beyond code/)])
  })
  test('unknown diagram id', () => {
    expect(messages([withBlock('id: nope', 'diagram')])).toEqual([expect.stringMatching(/unknown diagram "nope"/)])
  })
  test('valid blocks produce no issues', () => {
    expect(messages([withBlock('code: "x := 1"\nhotspots: [{ line: 1, match: ":=", title: t, note: n }]')])).toEqual([])
    expect(messages([withBlock('id: slices-backing-array', 'diagram')])).toEqual([])
  })
})
