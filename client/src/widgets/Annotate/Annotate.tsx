import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import CodeView, { type CodeHotspot } from '../../code/CodeView'
import { locateHotspot } from '../../content/hotspots'
import type { AnnotateData } from '../../content/schemas'

export default function Annotate({ data }: { data: AnnotateData }) {
  const spots = useMemo<CodeHotspot[]>(
    () =>
      data.hotspots.flatMap((h, i) => {
        const r = locateHotspot(data.code, h)
        return r ? [{ id: String(i), line: r.line, start: r.start, end: r.end }] : []
      }),
    [data],
  )
  const [active, setActive] = useState<number | null>(null)
  const total = data.hotspots.length
  const next = () => setActive((a) => (a === null ? 0 : (a + 1) % total))
  const current = active === null ? null : data.hotspots[active]

  return (
    <section
      data-widget="annotate"
      className="my-6 rounded-2xl border border-edge bg-surface-2/40 p-3 outline-none focus-within:ring-1 focus-within:ring-gopher/50"
      onKeyDown={(e) => { if (e.key === 'n' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); next() } }}
    >
      <header className="mb-2 flex items-center justify-between gap-3 px-1 text-xs uppercase tracking-wide text-muted">
        <span>Annotated code · click the highlighted parts</span>
        <span className="flex items-center gap-2">
          <span className="font-mono normal-case">{active === null ? `${total} hotspots` : `${active + 1} / ${total}`}</span>
          <button type="button" onClick={next} className="rounded-md border border-edge bg-surface px-2 py-1 font-medium normal-case text-text hover:border-gopher">
            Next hotspot <kbd className="ml-1 rounded bg-surface-2 px-1 font-mono text-[10px] text-muted">n</kbd>
          </button>
        </span>
      </header>
      <CodeView
        code={data.code}
        lang={data.lang}
        hotspots={spots}
        activeHotspotId={active === null ? null : String(active)}
        onHotspotClick={(id) => setActive(Number(id))}
      />
      <div data-testid="annotate-panel" aria-live="polite" className="mt-3 min-h-14 rounded-xl border border-edge bg-surface p-4 text-sm">
        {current ? (
          <>
            <h4 className="mb-1 font-semibold text-sun">{current.title}</h4>
            <div className="prose-go [&_p]:my-1 [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:font-mono [&_code]:text-sky">
              <ReactMarkdown>{current.note}</ReactMarkdown>
            </div>
            {current.link && (
              <a href={current.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sky underline underline-offset-4">
                Read more ↗
              </a>
            )}
          </>
        ) : (
          <p className="text-muted">Click a highlighted token, or press <strong>Next hotspot</strong>.</p>
        )}
      </div>
    </section>
  )
}
