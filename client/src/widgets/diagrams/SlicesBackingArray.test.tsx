import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import SlicesBackingArray from './SlicesBackingArray'

test('walks the four scripted steps and grows the array on the last one', async () => {
  render(<SlicesBackingArray />)
  expect(screen.getByTestId('diagram-caption')).toHaveTextContent('s := []int{1, 2, 3}')
  expect(screen.getByTestId('array-cells').children).toHaveLength(3)
  const step = screen.getByRole('button', { name: /^step$/i })
  await userEvent.click(step)
  expect(screen.getByTestId('diagram-caption')).toHaveTextContent('t := s[:2]')
  await userEvent.click(step)
  expect(screen.getByTestId('diagram-caption')).toHaveTextContent('append(t, 99)')
  expect(screen.getByTestId('array-cells')).toHaveTextContent('99')
  await userEvent.click(step)
  expect(screen.getByTestId('diagram-caption')).toHaveTextContent('cap 6')
  expect(screen.getByTestId('array-cells').children).toHaveLength(6)
  expect(step).toBeDisabled()
  await userEvent.click(screen.getByRole('button', { name: /reset/i }))
  expect(screen.getByTestId('array-cells').children).toHaveLength(3)
})
