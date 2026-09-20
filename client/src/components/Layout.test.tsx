import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, expect, test } from 'vitest'
import Layout from './Layout'

beforeEach(() => localStorage.clear())

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<h1>Home page</h1>} />
          <Route path="/:partId/:chapterId/:lessonId" element={<h1>Lesson page</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

const drawer = () => document.getElementById('chapter-drawer')

test('opens the mobile chapter drawer and closes it from the backdrop', async () => {
  const user = userEvent.setup()
  renderAt('/')
  const toggle = screen.getByRole('button', { name: 'Toggle chapters' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(drawer()).toBeNull()
  await user.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(within(drawer()!).getByRole('navigation', { name: 'Course' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Close chapters' }))
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(drawer()).toBeNull()
})

test('closes the mobile drawer after choosing a lesson', async () => {
  const user = userEvent.setup()
  renderAt('/')
  await user.click(screen.getByRole('button', { name: 'Toggle chapters' }))
  await user.click(within(drawer()!).getByRole('button', { name: 'Expand all' }))
  await user.click(within(drawer()!).getByRole('link', { name: /Install & hello, world/ }))
  expect(screen.getByRole('heading', { name: 'Lesson page' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Toggle chapters' })).toHaveAttribute('aria-expanded', 'false')
  expect(drawer()).toBeNull()
})

test('collapses the desktop sidebar and remembers the choice', async () => {
  const user = userEvent.setup()
  const view = renderAt('/')
  const toggle = screen.getByRole('button', { name: 'Toggle sidebar' })
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(document.getElementById('chapter-sidebar')).not.toBeNull()
  await user.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(document.getElementById('chapter-sidebar')).toBeNull()
  expect(localStorage.getItem('go-tour-course:sidebar')).toBe('closed')
  view.unmount()
  renderAt('/')
  expect(screen.getByRole('button', { name: 'Toggle sidebar' })).toHaveAttribute('aria-expanded', 'false')
  expect(document.getElementById('chapter-sidebar')).toBeNull()
})
