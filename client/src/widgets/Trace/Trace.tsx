import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import CodeView from '../../code/CodeView'
import type { TraceData } from '../../content/schemas'

export default function Trace({ data }: { data: TraceData }) {
  const [i, setI] = useState(0)
  const steps = data.steps
  const step = steps[i]!
  const prev = i > 0 ? steps[i - 1] : undefined
  const last = steps.length - 1
  const output = steps.slice(0, i + 1).map((s) => s.out ?? '').join('')
  const hasGoroutines = steps.some((s) => s.goroutines)
  const hasChannels = steps.some((s) => s.channels)
  const goroutines = step.goroutines ?? prev?.goroutines ?? []
  const channels = step.channels ?? prev?.channels ?? {}

  return (
    <section
      data-widget="trace"
      data-testid="trace-root"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); setI((n) => Math.min(last, n + 1)) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); setI((n) => Math.max(0, n - 1)) }
      }}
      className="my-6 rounded-2xl border border-edge bg-surface-2/40 p-3 outline-none focus:ring-1 focus:ring-gopher/50"
    >
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs uppercase tracking-wide text-muted">
        <span>Step-through · ← → keys</span>
        <span className="flex items-center gap-2 normal-case">
          <button type="button" onClick={() => setI(0)} className="rounded-md border border-edge bg-surface px-2 py-1 text-text hover:border-gopher">Reset</button>
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-md border border-edge bg-surface px-2 py-1 text-text hover:border-gopher disabled:opacity-40">← Prev</button>
          <span className="font-mono">{i + 1} / {steps.length}</span>
          <button type="button" disabled={i === last} onClick={() => setI(i + 1)} className="rounded-md border border-gopher bg-gopher/15 px-2 py-1 font-medium text-text hover:bg-gopher/25 disabled:opacity-40">Next →</button>
        </span>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CodeView code={data.code} lang={data.lang} showLineNumbers lineMarks={{ [step.line]: 'current' }} />
        <div className="flex flex-col gap-3 text-sm">
          <motion.p key={i} data-testid="trace-note" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-sun/40 bg-sun/10 p-3">
            {step.note}
          </motion.p>

          <Panel title="Variables">
            <table data-testid="trace-vars" className="w-full font-mono text-xs">
              <tbody>
                {Object.entries(step.vars ?? {}).map(([k, v]) => {
                  const changed = prev?.vars?.[k] !== v
                  return (
                    <tr key={k} className="border-t border-edge/60">
                      <td className="py-1 pr-3 text-sky">{k}</td>
                      <motion.td key={v} initial={changed ? { backgroundColor: 'rgba(253,221,0,0.35)' } : false} animate={{ backgroundColor: 'rgba(253,221,0,0)' }} transition={{ duration: 0.8 }} className="py-1">{v}</motion.td>
                    </tr>
                  )
                })}
                {!step.vars && <tr><td className="py-1 text-muted">—</td></tr>}
              </tbody>
            </table>
          </Panel>

          <Panel title="Output">
            <pre data-testid="trace-output" className="min-h-8 whitespace-pre-wrap font-mono text-xs text-aqua">{output || ' '}</pre>
          </Panel>

          {hasGoroutines && (
            <Panel title="Goroutines">
              <div className="flex flex-wrap gap-1.5">
                {goroutines.map((g) => (
                  <motion.span key={g} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="rounded-full border border-gopher/60 bg-gopher/15 px-2 py-0.5 font-mono text-xs">{g}</motion.span>
                ))}
                {goroutines.length === 0 && <span className="text-xs text-muted">none</span>}
              </div>
            </Panel>
          )}

          {hasChannels && (
            <Panel title="Channels">
              {Object.entries(channels).map(([name, ch]) => (
                <div key={name} data-testid={`trace-chan-${name}`} className="mb-2 last:mb-0">
                  <div className="mb-1 flex items-center gap-2 font-mono text-xs">
                    <span className="text-sky">{name}</span>
                    <span className="text-muted">{ch.cap === 0 ? 'unbuffered' : `cap ${ch.cap}`}</span>
                    {ch.closed && <span className="rounded bg-fuchsia/20 px-1 text-fuchsia">closed</span>}
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.max(ch.cap, 1) }).map((_, slot) => (
                      <motion.div key={slot} layout className={`flex h-7 w-10 items-center justify-center rounded border font-mono text-xs ${ch.buf[slot] !== undefined ? 'border-aqua bg-aqua/20 text-aqua' : 'border-edge border-dashed text-muted/50'}`}>
                        {ch.buf[slot] ?? (ch.cap === 0 ? '⇄' : '')}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </section>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-3">
      <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">{title}</div>
      {children}
    </div>
  )
}
