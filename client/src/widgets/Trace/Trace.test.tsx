import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Trace from './Trace'
import type { TraceData } from '../../content/schemas'

vi.mock('../../code/highlighter', () => ({ tokenize: async () => null }))

const data: TraceData = {
  code: 'ch := make(chan int, 1)\nch <- 1\nfmt.Println(<-ch)\n',
  lang: 'go',
  steps: [
    { line: 1, note: 'Buffered channel, capacity 1.', vars: { ch: 'chan int' }, goroutines: ['main'], channels: { ch: { buf: [], cap: 1 } } },
    { line: 2, note: 'Send fills the buffer.', vars: { ch: 'chan int' }, channels: { ch: { buf: ['1'], cap: 1 } } },
    { line: 3, note: 'Receive drains and prints.', out: '1\n', channels: { ch: { buf: [], cap: 1, closed: false } } },
  ],
}

test('starts at step 1 with its line highlighted', () => {
  const { container } = render(<Trace data={data} />)
  expect(screen.getByTestId('trace-note')).toHaveTextContent('Buffered channel')
  expect(container.querySelector('[data-line="1"]')).toHaveAttribute('data-mark', 'current')
  expect(screen.getByText('1 / 3')).toBeInTheDocument()
  expect(screen.getByTestId('trace-vars')).toHaveTextContent('ch')
  expect(screen.getByText('main')).toBeInTheDocument()
})

test('Next/Prev move; output accumulates; channel buffer shows values', async () => {
  const { container } = render(<Trace data={data} />)
  const next = screen.getByRole('button', { name: /next/i })
  await userEvent.click(next)
  expect(screen.getByTestId('trace-chan-ch')).toHaveTextContent('1')
  expect(container.querySelector('[data-line="2"]')).toHaveAttribute('data-mark', 'current')
  await userEvent.click(next)
  expect(screen.getByTestId('trace-output')).toHaveTextContent('1')
  expect(next).toBeDisabled()
  await userEvent.click(screen.getByRole('button', { name: /prev/i }))
  expect(screen.getByText('2 / 3')).toBeInTheDocument()
})

test('arrow keys step and Reset returns to the start', async () => {
  render(<Trace data={data} />)
  const root = screen.getByTestId('trace-root')
  root.focus()
  await userEvent.keyboard('{ArrowRight}{ArrowRight}')
  expect(screen.getByText('3 / 3')).toBeInTheDocument()
  await userEvent.keyboard('{ArrowLeft}')
  expect(screen.getByText('2 / 3')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /reset/i }))
  expect(screen.getByText('1 / 3')).toBeInTheDocument()
})

test('omits goroutine and channel panels when no step defines them', () => {
  render(<Trace data={{ code: 'x := 1', lang: 'go', steps: [{ line: 1, note: 'n', vars: { x: '1' } }] }} />)
  expect(screen.queryByText(/goroutines/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/channels/i)).not.toBeInTheDocument()
})

test('goroutines and channels persist from the last step that defined them', async () => {
  render(<Trace data={data} />)
  const next = screen.getByRole('button', { name: /next/i })
  await userEvent.click(next)
  await userEvent.click(next)
  expect(screen.getByText('main')).toBeInTheDocument()
  expect(screen.getByTestId('trace-chan-ch')).toBeInTheDocument()
})

test('a variable that changes value is flagged', async () => {
  render(
    <Trace
      data={{
        code: 'x := 1\nx = 2',
        lang: 'go',
        steps: [
          { line: 1, note: 'a', vars: { x: '1' } },
          { line: 2, note: 'b', vars: { x: '2' } },
        ],
      }}
    />,
  )
  const cell = () => screen.getByTestId('trace-vars').querySelector('[data-changed]')
  expect(cell()).toHaveAttribute('data-changed', 'false')
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(cell()).toHaveAttribute('data-changed', 'true')
})
