import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { course, findLesson, flattenLessons, lessonPath } from '../content/manifest'
import { loadLessonMarkdown } from '../content/loader'
import LessonMarkdown from '../markdown/LessonMarkdown'
import { markDone, useProgress } from '../store/progress'
import NotFound from './NotFound'

export default function Lesson() {
  const { partId = '', chapterId = '', lessonId = '' } = useParams()
  const ref = findLesson(course, partId, chapterId, lessonId)
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const progress = useProgress()

  useEffect(() => {
    if (!ref) return
    let alive = true
    setMarkdown(null)
    setError(null)
    loadLessonMarkdown(ref.lesson.file)
      .then((md) => { if (alive) setMarkdown(md) })
      .catch((e: Error) => { if (alive) setError(e.message) })
    return () => { alive = false }
  }, [ref?.lesson.file])

  if (!ref) return <NotFound />
  const all = flattenLessons(course)
  const prev = all[ref.index - 1]
  const next = all[ref.index + 1]
  const done = progress.lessons[ref.lesson.id]?.done === true

  return (
    <article>
      <div className="mb-4 text-xs uppercase tracking-wide text-muted">
        {ref.part.title} · {ref.chapter.title}
      </div>
      {error && <div role="alert" className="rounded-xl border border-fuchsia/50 bg-fuchsia/10 p-3 text-sm text-fuchsia">{error}</div>}
      {markdown === null && !error && <div className="h-40 animate-pulse rounded-xl bg-surface" />}
      {markdown !== null && <LessonMarkdown markdown={markdown} lessonId={ref.lesson.id} />}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-edge pt-4 text-sm">
        <a href={ref.lesson.ref} target="_blank" rel="noreferrer" className="text-sky underline underline-offset-4">
          Reference ↗ {new URL(ref.lesson.ref).hostname}
        </a>
        <button type="button" onClick={() => markDone(ref.lesson.id, !done)}
          className={`ml-auto rounded-lg border px-3 py-1.5 font-medium ${done ? 'border-aqua bg-aqua/15 text-aqua' : 'border-edge bg-surface hover:border-gopher'}`}>
          {done ? '✓ Completed' : 'Mark complete'}
        </button>
      </div>
      <nav className="mt-4 flex justify-between gap-3 text-sm">
        {prev ? <Link to={lessonPath(prev)} className="rounded-lg border border-edge px-3 py-2 hover:border-gopher">← Prev: {prev.lesson.title}</Link> : <span />}
        {next ? <Link to={lessonPath(next)} className="rounded-lg border border-gopher bg-gopher/15 px-3 py-2 hover:bg-gopher/25">Next: {next.lesson.title} →</Link> : <span />}
      </nav>
    </article>
  )
}
