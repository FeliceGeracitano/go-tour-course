import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { reloadProgress } from '../store/progress'
import LessonMarkdown from './LessonMarkdown'

vi.mock('../code/highlighter', () => ({ tokenize: async () => null }))

beforeEach(() => {
  localStorage.clear()
  reloadProgress()
})

test('renders prose, inline code, and plain go fences through CodeBlock', () => {
  const md = '# Hi\n\nUse `fmt` here.\n\n```go\nfmt.Println("x")\n```\n'
  const { container } = render(<LessonMarkdown markdown={md} lessonId="l" />)
  expect(screen.getByRole('heading', { name: 'Hi' })).toBeInTheDocument()
  expect(container.querySelector('code')).toHaveTextContent('fmt')
  expect(container.querySelector('[data-line="1"]')).toHaveTextContent('fmt.Println("x")')
  expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
})

test('dispatches widget fences and numbers quizzes per lesson', () => {
  const md = [
    '```quiz', 'type: mcq', 'question: q1', 'options: [a, b]', 'answer: 0', 'explain: e', '```', '',
    '```annotate', 'code: "x := 1"', 'hotspots: [{ line: 1, match: ":=", title: T, note: N }]', '```', '',
    '```quiz', 'type: mcq', 'question: q2', 'options: [a, b]', 'answer: 1', 'explain: e', '```',
  ].join('\n')
  const { container } = render(<LessonMarkdown markdown={md} lessonId="slices" />)
  expect(container.querySelectorAll('[data-widget="quiz"]')).toHaveLength(2)
  expect(container.querySelector('[data-widget="annotate"]')).toBeInTheDocument()
  expect(container.querySelectorAll('[data-quiz-key]')[1]).toHaveAttribute('data-quiz-key', 'slices#1')
})

test('shows an inline error card for an invalid widget block', () => {
  render(<LessonMarkdown markdown={'```quiz\ntype: nope\n```\n'} lessonId="l" />)
  expect(screen.getByRole('alert')).toHaveTextContent(/quiz/i)
})

test('renders GFM tables', () => {
  render(<LessonMarkdown markdown={'| a | b |\n|---|---|\n| 1 | 2 |\n'} lessonId="l" />)
  expect(screen.getByRole('table')).toBeInTheDocument()
})

test('widget state survives a parent re-render', async () => {
  const md = '```quiz\ntype: mcq\nquestion: q\noptions: [a, b]\nanswer: 0\nexplain: e\n```\n'
  const { rerender } = render(<LessonMarkdown markdown={md} lessonId="stable" />)
  await userEvent.click(screen.getByRole('button', { name: 'a' }))
  expect(screen.getByTestId('quiz-result')).toBeInTheDocument()
  rerender(<LessonMarkdown markdown={md} lessonId="stable" />)
  expect(screen.getByTestId('quiz-result')).toBeInTheDocument()
})
