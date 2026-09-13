import { Link } from 'react-router'
import { course, flattenLessons, lessonPath } from '../content/manifest'
import { useProgress } from '../store/progress'

export default function Home() {
  const progress = useProgress()
  const all = flattenLessons(course)
  const doneCount = all.filter((r) => progress.lessons[r.lesson.id]?.done).length
  const firstOf = (partId: string) => all.find((r) => r.part.id === partId)!

  return (
    <div>
      <section className="flex flex-col items-center gap-6 py-10 text-center sm:flex-row sm:text-left">
        <img src={`${import.meta.env.BASE_URL}gopher.svg`} alt="The Go gopher" className="h-32 w-32" />
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Go Tour Course</h1>
          <p className="mt-3 max-w-xl text-muted">
            Learn Go by reading and clicking: annotated code, step-through traces, quizzes, and diagrams.
            No toolchain needed. Structured after <em>A Tour of Go</em>, with a patterns cheatsheet and a chapter on the <code className="font-mono text-sky">go</code> command.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link to={lessonPath(firstOf('part1_tour'))} className="rounded-xl bg-gopher px-4 py-2 font-semibold text-bg hover:bg-sky">Start the Tour →</Link>
            <span className="text-sm text-muted">{doneCount} / {all.length} lessons done</span>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {course.parts.map((part, i) => {
          const lessons = all.filter((r) => r.part.id === part.id)
          const done = lessons.filter((r) => progress.lessons[r.lesson.id]?.done).length
          const to = part.id === 'part2_patterns' ? '/patterns' : lessonPath(firstOf(part.id))
          return (
            <Link key={part.id} to={to} className="rounded-2xl border border-edge bg-surface p-5 transition hover:border-gopher">
              <div className="text-xs uppercase tracking-wide text-muted">Part {i + 1}</div>
              <div className="mt-1 text-lg font-semibold">{part.title}</div>
              <div className="mt-2 text-sm text-muted">{lessons.length} lessons · {done} done</div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
