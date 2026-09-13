import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import Quiz from './Quiz'
import { getProgress, reloadProgress } from '../../store/progress'
import type { QuizData } from '../../content/schemas'

vi.mock('../../code/highlighter', () => ({ tokenize: async () => null }))
beforeEach(() => { localStorage.clear(); reloadProgress() })

const mcq: QuizData = { type: 'mcq', question: 'Which keyword declares a package?', options: ['module', 'package', 'import'], answer: 1, explain: 'Every Go file starts with a package clause.' }

test('wrong pick shows explanation, reveals the answer, records attempt', async () => {
  render(<Quiz data={mcq} quizKey="l#0" />)
  await userEvent.click(screen.getByRole('button', { name: 'module' }))
  expect(screen.getByTestId('quiz-result')).toHaveTextContent(/not quite/i)
  expect(screen.getByTestId('quiz-result')).toHaveTextContent('Every Go file starts with a package clause.')
  expect(screen.getByRole('button', { name: 'module' })).toHaveAttribute('data-state', 'wrong')
  expect(screen.getByRole('button', { name: 'package' })).toHaveAttribute('data-state', 'correct')
  expect(getProgress().quizzes['l#0']).toEqual({ correct: false, attempts: 1 })
})

test('correct pick celebrates; try again resets choices but keeps attempts', async () => {
  render(<Quiz data={mcq} quizKey="l#0" />)
  await userEvent.click(screen.getByRole('button', { name: 'package' }))
  expect(screen.getByTestId('quiz-result')).toHaveTextContent(/correct/i)
  await userEvent.click(screen.getByRole('button', { name: /try again/i }))
  expect(screen.queryByTestId('quiz-result')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'package' }))
  expect(getProgress().quizzes['l#0']?.attempts).toBe(2)
})

test('options are disabled after answering', async () => {
  render(<Quiz data={mcq} quizKey="l#0" />)
  await userEvent.click(screen.getByRole('button', { name: 'import' }))
  expect(screen.getByRole('button', { name: 'module' })).toBeDisabled()
})

test('predict renders the code and default question', () => {
  const predict: QuizData = { type: 'predict', question: 'What does this print?', code: 'fmt.Println(1 + 1)', options: ['2', '11'], answer: 0, explain: 'ints add.' }
  const { container } = render(<Quiz data={predict} quizKey="l#1" />)
  expect(screen.getByText('What does this print?')).toBeInTheDocument()
  expect(container.querySelector('[data-line="1"]')).toHaveTextContent('fmt.Println(1 + 1)')
})

test('spotline marks picked and correct lines', async () => {
  const spot: QuizData = { type: 'spotline', question: 'Which line does not compile?', code: 'x := 1\nx := 2\nfmt.Println(x)', answer: 2, explain: 'x is already declared; use = not :=.' }
  const { container } = render(<Quiz data={spot} quizKey="l#2" />)
  await userEvent.click(screen.getByRole('button', { name: /fmt\.Println\(x\)/ }))
  expect(container.querySelector('[data-line="3"]')).toHaveAttribute('data-mark', 'wrong')
  expect(container.querySelector('[data-line="2"]')).toHaveAttribute('data-mark', 'correct')
  expect(screen.getByTestId('quiz-result')).toHaveTextContent(/line 2/i)
})

test('shows a previous result badge from progress', () => {
  localStorage.setItem('go-tour-course:v1', JSON.stringify({ lessons: {}, quizzes: { 'l#0': { correct: true, attempts: 3 } } }))
  reloadProgress()
  render(<Quiz data={mcq} quizKey="l#0" />)
  expect(screen.getByText(/answered correctly before/i)).toBeInTheDocument()
})
