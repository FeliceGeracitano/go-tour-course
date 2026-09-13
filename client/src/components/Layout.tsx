import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import Sidebar from './Sidebar'

const SIDEBAR_KEY = 'go-tour-course:sidebar'
function readSidebar(): boolean {
  try { return localStorage.getItem(SIDEBAR_KEY) !== 'closed' } catch { return true }
}

export default function Layout() {
  const [open, setOpen] = useState(readSidebar)
  const { pathname } = useLocation()
  useEffect(() => { try { localStorage.setItem(SIDEBAR_KEY, open ? 'open' : 'closed') } catch { /* ignore */ } }, [open])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])

  const nav = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-2 py-1 text-sm ${isActive ? 'bg-gopher/15 text-text' : 'text-muted hover:text-text'}`

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-edge bg-bg/90 px-4 py-2 backdrop-blur">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Toggle sidebar" aria-expanded={open}
          className="rounded-md border border-edge px-2 py-1 text-muted hover:text-text">☰</button>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src={`${import.meta.env.BASE_URL}gopher.svg`} alt="" className="h-6 w-6" />
          <span>Go Tour Course</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          <NavLink to="/part1_tour/ch00_getting_started/install_hello" className={nav}>Tour</NavLink>
          <NavLink to="/patterns" className={nav}>Patterns</NavLink>
          <NavLink to="/part3_toolchain/go_cli/build_run_install" className={nav}>Toolchain</NavLink>
        </nav>
      </header>
      <div className="flex flex-1">
        {open && (
          <aside className="sticky top-[45px] hidden h-[calc(100vh-45px)] w-72 shrink-0 overflow-y-auto border-r border-edge p-3 md:block">
            <Sidebar />
          </aside>
        )}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>
      <footer className="border-t border-edge px-4 py-3 text-center text-xs text-muted">
        Gopher by Renee French (CC BY 3.0), vector by Takuya Ueda · Go Mono font by Bigelow &amp; Holmes ·
        Built after <a className="underline" href="https://go.dev/tour" target="_blank" rel="noreferrer">A Tour of Go</a>
      </footer>
    </div>
  )
}
