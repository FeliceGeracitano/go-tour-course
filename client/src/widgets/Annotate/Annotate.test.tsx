import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Annotate from './Annotate'
import type { AnnotateData } from '../../content/schemas'

vi.mock('../../code/highlighter', () => ({ tokenize: async () => null }))

const data: AnnotateData = {
  code: 'x := 42\nfmt.Println(x)\n',
  lang: 'go',
  hotspots: [
    { line: 1, match: ':=', occurrence: 1, title: 'Short declaration', note: 'Declares **and** initialises.' },
    { line: 2, match: 'Println', occurrence: 1, title: 'Println', note: 'Prints with a newline.', link: 'https://pkg.go.dev/fmt#Println' },
  ],
}

test('starts with a hint and shows the hotspot note on click', async () => {
  render(<Annotate data={data} />)
  expect(screen.getByTestId('annotate-panel')).toHaveTextContent(/click a highlighted/i)
  await userEvent.click(screen.getByRole('button', { name: ':=' }))
  expect(screen.getByTestId('annotate-panel')).toHaveTextContent('Short declaration')
  expect(screen.getByText('and')).toBeInTheDocument() // markdown note rendered (bold)
  expect(screen.getByText('1 / 2')).toBeInTheDocument()
})

test('Next walks hotspots in order and wraps; links render', async () => {
  render(<Annotate data={data} />)
  const next = screen.getByRole('button', { name: /next hotspot/i })
  await userEvent.click(next)
  expect(screen.getByTestId('annotate-panel')).toHaveTextContent('Short declaration')
  await userEvent.click(next)
  expect(screen.getByTestId('annotate-panel')).toHaveTextContent('Println')
  expect(screen.getByRole('link', { name: /read more/i })).toHaveAttribute('href', 'https://pkg.go.dev/fmt#Println')
  await userEvent.click(next)
  expect(screen.getByText('1 / 2')).toBeInTheDocument()
})

test('pressing n advances', async () => {
  render(<Annotate data={data} />)
  await userEvent.click(screen.getByRole('button', { name: /next hotspot/i }))
  await userEvent.keyboard('n')
  expect(screen.getByTestId('annotate-panel')).toHaveTextContent('Println')
})
