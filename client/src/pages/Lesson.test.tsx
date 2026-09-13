import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, expect, test, vi } from 'vitest'
import Lesson from './Lesson'
import { getProgress, reloadProgress } from '../store/progress'

vi.mock('../code/highlighter', () => ({ tokenize: async () => null }))
vi.mock('../content/loader', () => ({
  loadLessonMarkdown: async (file: string) => `# Loaded ${file}\n\nbody text\n`,
}))
beforeEach(() => { localStorage.clear(); reloadProgress() })

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:partId/:chapterId/:lessonId" element={<Lesson />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('loads the lesson markdown and shows breadcrumb, reference, prev/next', async () => {
  renderAt('/part1_tour/ch01_basics/functions')
  expect(await screen.findByRole('heading', { name: /Loaded part1_tour\/ch01_basics\/02_functions\.md/ })).toBeInTheDocument()
  expect(screen.getByText(/Packages, variables, functions/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /reference/i })).toHaveAttribute('href', 'https://go.dev/tour/basics/4')
  expect(screen.getByRole('link', { name: /prev/i })).toHaveAttribute('href', '/part1_tour/ch01_basics/packages_imports')
  expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute('href', '/part1_tour/ch01_basics/variables')
})

test('first lesson has no prev link; mark complete toggles progress', async () => {
  renderAt('/part1_tour/ch00_getting_started/install_hello')
  await screen.findByRole('heading', { name: /Loaded/ })
  expect(screen.queryByRole('link', { name: /prev/i })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /mark complete/i }))
  expect(getProgress().lessons.install_hello?.done).toBe(true)
  expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument()
})

test('unknown lesson shows not found', () => {
  renderAt('/part1_tour/ch01_basics/nope')
  expect(screen.getByText(/not found/i)).toBeInTheDocument()
})
