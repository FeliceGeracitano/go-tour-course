import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { course, lessonPath } from '../content/manifest'

export default function Cheatsheet() {
  const part = course.parts.find((p) => p.id === 'part2_patterns')!
  const entries = useMemo(() => part.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ part, chapter, lesson, index: 0 }))), [part])
  const allTags = useMemo(() => [...new Set(entries.flatMap((e) => e.lesson.tags ?? []))].sort(), [entries])
  const [tag, setTag] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const shown = entries.filter((e) => {
    if (tag && !(e.lesson.tags ?? []).includes(tag)) return false
    const hay = `${e.lesson.title} ${e.lesson.problem ?? ''}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  return (
    <div>
      <h1 className="text-3xl font-bold">Patterns &amp; use cases</h1>
      <p className="mt-2 text-muted">Problem first, then the idiomatic Go. Filter by tag or search.</p>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patterns…" aria-label="Search patterns"
        className="mt-4 w-full rounded-xl border border-edge bg-surface px-3 py-2 outline-none focus:border-gopher" />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {allTags.map((t) => (
          <button key={t} type="button" onClick={() => setTag(tag === t ? null : t)} aria-pressed={tag === t}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${tag === t ? 'border-gopher bg-gopher/20' : 'border-edge text-muted hover:text-text'}`}>{t}</button>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {shown.map((e) => (
          <Link key={e.lesson.id} to={lessonPath(e)} className="group rounded-2xl border border-edge bg-surface p-4 transition hover:border-gopher">
            <div className="text-[11px] uppercase tracking-wide text-muted">{e.chapter.title}</div>
            <div className="mt-1 font-semibold group-hover:text-sky">{e.lesson.title} →</div>
            <p className="mt-1 text-sm text-muted">{e.lesson.problem}</p>
            <div className="mt-2 flex flex-wrap gap-1">{(e.lesson.tags ?? []).map((t) => <span key={t} className="rounded bg-surface-2 px-1.5 text-[11px] text-muted">{t}</span>)}</div>
          </Link>
        ))}
        {shown.length === 0 && <p className="text-muted">No patterns match.</p>}
      </div>
    </div>
  )
}
