import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import ServiceDependencies from './ServiceDependencies'

test('distinguishes imports, runtime calls, and shared-instance wiring', async () => {
  const user = userEvent.setup()
  render(<ServiceDependencies />)
  expect(screen.getByRole('button', { name: 'Imports' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('img')).toHaveAccessibleName(/Selected package imports/)
  await user.click(screen.getByRole('button', { name: 'Request' }))
  expect(screen.getByRole('img')).toHaveAccessibleName(/Runtime calls/)
  expect(screen.getByTestId('service-diagram-description')).toHaveTextContent('Only an existing customer')
  await user.click(screen.getByRole('button', { name: 'Startup' }))
  expect(screen.getByTestId('service-diagram-description')).toHaveTextContent('that same instance')
  expect(screen.getByRole('button', { name: 'Imports' })).toHaveAttribute('aria-pressed', 'false')
})
