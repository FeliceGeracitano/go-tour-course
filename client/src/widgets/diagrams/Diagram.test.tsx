import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Diagram from './Diagram'

test('renders a registered diagram lazily', async () => {
  render(<Diagram data={{ id: 'slices-backing-array' }} />)
  expect(await screen.findByTestId('diagram-caption')).toBeInTheDocument()
})

test('shows an error card for an unknown id', () => {
  render(<Diagram data={{ id: 'nope' }} />)
  expect(screen.getByRole('alert')).toHaveTextContent(/unknown diagram "nope"/)
})
