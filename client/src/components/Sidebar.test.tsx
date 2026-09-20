import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, expect, test } from 'vitest'
import Sidebar from './Sidebar'
import { course } from '../content/manifest'
import { markDone, reloadProgress } from '../store/progress'

beforeEach(() => { localStorage.clear(); reloadProgress() })

const chapterCount = course.parts.reduce((n, p) => n + p.chapters.length, 0)

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:partId/:chapterId/:lessonId" element={<Sidebar />} />
        <Route path="*" element={<Sidebar />} />
      </Routes>
    </MemoryRouter>,
  )
}

const chapterButtons = () => screen.getAllByRole('button', { expanded: true })

test('renders parts and chapters with lesson links and done ticks', () => {
  markDone('install_hello', true)
  renderAt('/part1_tour/ch00_getting_started/install_hello')
  expect(screen.getByText('Tour')).toBeInTheDocument()
  expect(screen.getByText('Patterns & use cases')).toBeInTheDocument()
  const link = screen.getByRole('link', { name: /0\.1 Install & hello, world/ })
  expect(link).toHaveAttribute('href', '/part1_tour/ch00_getting_started/install_hello')
  expect(link).toHaveAttribute('data-done', 'true')
  expect(screen.getByRole('link', { name: /0\.2 Modules quick start/ })).toHaveAttribute('data-done', 'false')
})

test('only the current chapter starts expanded', () => {
  renderAt('/part1_tour/ch01_basics/packages_imports')
  expect(chapterButtons()).toHaveLength(1)
  expect(chapterButtons()[0]).toHaveTextContent('Packages, variables, functions')
})

test('expand all opens every chapter; collapse all closes every chapter', async () => {
  const user = userEvent.setup()
  renderAt('/part1_tour/ch01_basics/packages_imports')

  await user.click(screen.getByRole('button', { name: 'Expand all' }))
  expect(chapterButtons()).toHaveLength(chapterCount)
  expect(screen.getByRole('link', { name: /build \/ run \/ install/ })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Collapse all' }))
  expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0)
  expect(screen.queryByRole('link', { name: /build \/ run \/ install/ })).not.toBeInTheDocument()
})

test('the current chapter can be collapsed by clicking its header', async () => {
  const user = userEvent.setup()
  renderAt('/part1_tour/ch01_basics/packages_imports')
  const header = screen.getByRole('button', { name: /Packages, variables, functions/ })
  expect(header).toHaveAttribute('aria-expanded', 'true')
  await user.click(header)
  expect(header).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('link', { name: /Packages, imports/ })).not.toBeInTheDocument()
})

test('renders without a chapter in the route with everything collapsed', () => {
  renderAt('/patterns')
  expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0)
  expect(screen.getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
})

test('navigating into another chapter expands it', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/part1_tour/ch01_basics/packages_imports']}>
      <Routes>
        <Route path="/:partId/:chapterId/:lessonId" element={<><Link to="/part2_patterns/errors/wrapping">jump</Link><Sidebar /></>} />
      </Routes>
    </MemoryRouter>,
  )
  expect(screen.getByRole('button', { name: /Errors/ })).toHaveAttribute('aria-expanded', 'false')
  await user.click(screen.getByRole('link', { name: 'jump' }))
  expect(screen.getByRole('button', { name: /Errors/ })).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('button', { name: /Packages, variables, functions/ })).toHaveAttribute('aria-expanded', 'true')
})
