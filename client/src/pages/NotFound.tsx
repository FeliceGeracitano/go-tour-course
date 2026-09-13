import { Link } from 'react-router'
export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="mt-2 text-muted">That page does not exist. <Link className="text-sky underline" to="/">Go home</Link>.</p>
    </div>
  )
}
