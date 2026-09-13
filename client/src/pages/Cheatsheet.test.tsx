import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'
import Cheatsheet from './Cheatsheet'

test('lists every pattern, filters by tag and by search', async () => {
  render(<MemoryRouter><Cheatsheet /></MemoryRouter>)
  const cards = () => screen.getAllByRole('link', { name: /→/ })
  expect(cards().length).toBeGreaterThanOrEqual(30)
  await userEvent.click(screen.getByRole('button', { name: 'context' }))
  expect(cards().every((c) => c.textContent?.includes('context'))).toBe(true)
  await userEvent.click(screen.getByRole('button', { name: 'context' })) // toggle off
  await userEvent.type(screen.getByRole('searchbox'), 'worker')
  expect(cards()).toHaveLength(1)
  expect(cards()[0]).toHaveAttribute('href', '/part2_patterns/concurrency/worker_pool')
})
