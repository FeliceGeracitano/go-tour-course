import { useState } from 'react'
import { NavLink, useParams } from 'react-router'
import { course, lessonPath, type Chapter, type Part } from '../content/manifest'
import { useProgress } from '../store/progress'
import ProgressRing from './ProgressRing'

const allChapterIds = course.parts.flatMap((p) => p.chapters.map((c) => c.id))

export default function Sidebar() {
  const { chapterId } = useParams()
  const progress = useProgress()
  const [open, setOpen] = useState<Set<string>>(() => new Set(chapterId ? [chapterId] : []))

  // Expand the chapter being navigated into. Adjusting state during render (rather than
  // in an effect) avoids painting a frame where the new chapter is still collapsed.
  const [seenChapter, setSeenChapter] = useState(chapterId)
  if (chapterId !== seenChapter) {
    setSeenChapter(chapterId)
    if (chapterId && !open.has(chapterId)) setOpen((s) => new Set(s).add(chapterId))
  }

  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const expandAll = () => setOpen(new Set(allChapterIds))
  const collapseAll = () => setOpen(new Set())
  const allOpen = allChapterIds.every((id) => open.has(id))
  const noneOpen = allChapterIds.every((id) => !open.has(id))

  return (
    <nav aria-label="Course" className="text-sm">
      <div className="mb-2 flex items-center justify-end gap-1 px-1 text-xs text-muted">
        <BulkButton onClick={expandAll} disabled={allOpen}>Expand all</BulkButton>
        <span aria-hidden="true">·</span>
        <BulkButton onClick={collapseAll} disabled={noneOpen}>Collapse all</BulkButton>
      </div>
      {course.parts.map((part) => (
        <PartBlock key={part.id} part={part} openIds={open} onToggle={toggle} done={(id) => progress.lessons[id]?.done === true} />
      ))}
    </nav>
  )
}

function BulkButton({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="rounded px-1.5 py-0.5 hover:bg-surface-2 hover:text-text disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted">
      {children}
    </button>
  )
}

function PartBlock({ part, openIds, onToggle, done }: {
  part: Part; openIds: Set<string>; onToggle: (id: string) => void; done: (lessonId: string) => boolean
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{part.title}</div>
      {part.chapters.map((ch) => (
        <ChapterBlock key={ch.id} part={part} chapter={ch} open={openIds.has(ch.id)} onToggle={() => onToggle(ch.id)} done={done} />
      ))}
    </div>
  )
}

function ChapterBlock({ part, chapter, open, onToggle, done }: {
  part: Part; chapter: Chapter; open: boolean; onToggle: () => void; done: (lessonId: string) => boolean
}) {
  const doneCount = chapter.lessons.filter((l) => done(l.id)).length
  return (
    <div>
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface-2">
        <ProgressRing done={doneCount} total={chapter.lessons.length} />
        <span className="flex-1 truncate">{chapter.number !== undefined ? `${chapter.number}. ` : ''}{chapter.title}</span>
        <span className="text-muted">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <ul className="mb-1 ml-3 border-l border-edge pl-2">
          {chapter.lessons.map((lesson) => {
            const isDone = done(lesson.id)
            return (
              <li key={lesson.id}>
                <NavLink to={lessonPath({ part, chapter, lesson, index: 0 })} data-done={isDone}
                  className={({ isActive }) => `flex items-center gap-2 rounded-md px-2 py-1 ${isActive ? 'bg-gopher/15 text-text' : 'text-muted hover:bg-surface-2 hover:text-text'}`}>
                  <span className={`w-3 text-center text-xs ${isDone ? 'text-aqua' : 'text-edge'}`}>{isDone ? '✓' : '·'}</span>
                  <span className="truncate">{lesson.number ? `${lesson.number} ` : ''}{lesson.title}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
