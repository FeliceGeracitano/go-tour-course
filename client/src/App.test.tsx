import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the course title', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /go tour course/i })).toBeInTheDocument()
})
