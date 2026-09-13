import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, expect, test } from 'vitest'
import Sidebar from './Sidebar'
import { markDone, reloadProgress } from '../store/progress'

beforeEach(() => { localStorage.clear(); reloadProgress() })

test('renders parts and chapters with lesson links and done ticks', () => {
  markDone('install_hello', true)
  render(
    <MemoryRouter initialEntries={['/part1_tour/ch00_getting_started/install_hello']}>
      <Routes>
        <Route path="/:partId/:chapterId/:lessonId" element={<Sidebar />} />
      </Routes>
    </MemoryRouter>,
  )
  expect(screen.getByText('Tour')).toBeInTheDocument()
  expect(screen.getByText('Patterns & use cases')).toBeInTheDocument()
  const link = screen.getByRole('link', { name: /0\.1 Install & hello, world/ })
  expect(link).toHaveAttribute('href', '/part1_tour/ch00_getting_started/install_hello')
  expect(link).toHaveAttribute('data-done', 'true')
  expect(screen.getByRole('link', { name: /0\.2 Modules quick start/ })).toHaveAttribute('data-done', 'false')
})
