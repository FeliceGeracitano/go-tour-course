import { expect, test } from 'vitest'
import { extractWidgetBlocks } from './parse'

const md = [
  '# Title',
  '',
  '```go',
  'fmt.Println("plain")',
  '```',
  '',
  '```quiz',
  'type: mcq',
  'question: q',
  'options: [a, b]',
  'answer: 0',
  'explain: e',
  '```',
  '',
  'Some prose.',
  '',
  '```annotate',
  'code: x',
  'hotspots: [{ line: 1, match: x, title: t, note: n }]',
  '```',
  '',
  '```quiz',
  'type: mcq',
  'question: q2',
  'options: [a, b]',
  'answer: 1',
  'explain: e',
  '```',
].join('\n')

test('extracts widget fences with lang, raw body, fence line, and indexes', () => {
  const blocks = extractWidgetBlocks(md)
  expect(blocks.map((b) => b.lang)).toEqual(['quiz', 'annotate', 'quiz'])
  expect(blocks[0]?.line).toBe(7)
  expect(blocks[0]?.raw).toBe('type: mcq\nquestion: q\noptions: [a, b]\nanswer: 0\nexplain: e')
  expect(blocks.map((b) => b.index)).toEqual([0, 1, 2])
  expect(blocks.map((b) => b.quizIndex)).toEqual([0, undefined, 1])
})

test('ignores plain code fences and inline code', () => {
  expect(extractWidgetBlocks('```go\nx\n```\n\n`inline`\n')).toEqual([])
})

test('returns [] for markdown without fences', () => {
  expect(extractWidgetBlocks('# just a heading\n\ntext')).toEqual([])
})
