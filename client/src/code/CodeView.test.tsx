import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import CodeView from './CodeView'

// Keep tests synchronous and deterministic: no Shiki in jsdom.
vi.mock('./highlighter', () => ({ tokenize: async () => null }))

const code = 'x := 1\ny := x + 2\n'

test('renders one element per line with data-line', () => {
  const { container } = render(<CodeView code={code} />)
  const lines = container.querySelectorAll('[data-line]')
  expect(lines).toHaveLength(2)
  expect(lines[1]).toHaveTextContent('y := x + 2')
})

test('renders hotspots as buttons and reports clicks', async () => {
  const onClick = vi.fn()
  render(<CodeView code={code} hotspots={[{ id: 'h1', line: 1, start: 2, end: 4 }]} onHotspotClick={onClick} activeHotspotId={null} />)
  const btn = screen.getByRole('button', { name: ':=' })
  expect(btn).toHaveAttribute('data-hotspot-id', 'h1')
  expect(btn).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(btn)
  expect(onClick).toHaveBeenCalledWith('h1')
})

test('marks the active hotspot as pressed', () => {
  render(<CodeView code={code} hotspots={[{ id: 'h1', line: 1, start: 2, end: 4 }]} activeHotspotId="h1" />)
  expect(screen.getByRole('button', { name: ':=' })).toHaveAttribute('aria-pressed', 'true')
})

test('applies line marks', () => {
  const { container } = render(<CodeView code={code} lineMarks={{ 2: 'current' }} />)
  expect(container.querySelector('[data-line="2"]')).toHaveAttribute('data-mark', 'current')
  expect(container.querySelector('[data-line="1"]')).not.toHaveAttribute('data-mark')
})

test('clickable lines call onLineClick with the 1-based line', async () => {
  const onLine = vi.fn()
  render(<CodeView code={code} onLineClick={onLine} />)
  await userEvent.click(screen.getByRole('button', { name: /y := x \+ 2/ }))
  expect(onLine).toHaveBeenCalledWith(2)
})

test('shows line numbers when asked', () => {
  const { container } = render(<CodeView code={code} showLineNumbers />)
  expect(container.querySelectorAll('[data-line-number]')).toHaveLength(2)
})
