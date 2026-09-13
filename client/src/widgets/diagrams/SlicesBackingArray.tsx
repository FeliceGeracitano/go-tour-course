import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { DiagramProps } from './registry'

type Frame = {
  code: string
  caption: string
  array: (number | null)[]
  arrayLabel: string
  slices: { name: string; start: number; len: number; cap: number; stale?: boolean }[]
  changed?: number
}

const FRAMES: Frame[] = [
  { code: 's := []int{1, 2, 3}', caption: 'A slice literal allocates a backing array of len 3 and returns a slice header (ptr, len 3, cap 3) over it.', array: [1, 2, 3], arrayLabel: 'backing array A · cap 3', slices: [{ name: 's', start: 0, len: 3, cap: 3 }] },
  { code: 't := s[:2]', caption: 'Reslicing makes a second header on the same array: t has len 2 but still cap 3 — it can "see" one more slot.', array: [1, 2, 3], arrayLabel: 'backing array A · cap 3', slices: [{ name: 's', start: 0, len: 3, cap: 3 }, { name: 't', start: 0, len: 2, cap: 3 }] },
  { code: 't = append(t, 99)', caption: 'append fits within cap, so it writes 99 into the shared array. s[2] is now 99 too — the classic aliasing surprise.', array: [1, 2, 99], arrayLabel: 'backing array A · cap 3', slices: [{ name: 's', start: 0, len: 3, cap: 3 }, { name: 't', start: 0, len: 3, cap: 3 }], changed: 2 },
  { code: 't = append(t, 4)', caption: 'No room left: append allocates a new array (cap 6), copies, and t now points there. s still points at the old array.', array: [1, 2, 99, 4, null, null], arrayLabel: 'backing array B · cap 6 (A still holds 1, 2, 99 for s)', slices: [{ name: 's', start: 0, len: 3, cap: 3, stale: true }, { name: 't', start: 0, len: 4, cap: 6 }], changed: 3 },
]

export default function SlicesBackingArray(_: DiagramProps) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const frame = FRAMES[i]!
  const last = FRAMES.length - 1

  useEffect(() => {
    if (!playing) return
    if (i === last) { setPlaying(false); return }
    const t = setTimeout(() => setI(i + 1), 1500)
    return () => clearTimeout(t)
  }, [playing, i, last])

  return (
    <div>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs uppercase tracking-wide text-muted">
        <span>Diagram · slices share a backing array</span>
        <span className="flex items-center gap-2 normal-case">
          <button type="button" onClick={() => { setI(0); setPlaying(false) }} className="rounded-md border border-edge bg-surface px-2 py-1 text-text hover:border-gopher">Reset</button>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="rounded-md border border-edge bg-surface px-2 py-1 text-text hover:border-gopher">{playing ? 'Pause' : 'Play'}</button>
          <button type="button" disabled={i === last} onClick={() => setI(i + 1)} className="rounded-md border border-gopher bg-gopher/15 px-2 py-1 font-medium text-text disabled:opacity-40">Step</button>
        </span>
      </header>

      <div className="overflow-x-auto rounded-xl border border-edge bg-surface p-4">
        <div className="mb-3 font-mono text-sm text-sun">{frame.code}</div>
        <div className="mb-1 text-[11px] uppercase tracking-wide text-muted">{frame.arrayLabel}</div>
        <div data-testid="array-cells" className="flex gap-1">
          {frame.array.map((v, idx) => (
            <motion.div key={`${i >= 3 ? 'B' : 'A'}-${idx}`} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className={`flex h-10 w-12 items-center justify-center rounded border font-mono text-sm ${v === null ? 'border-dashed border-edge text-muted/40' : frame.changed === idx ? 'border-sun bg-sun/20 text-sun' : 'border-gopher/60 bg-gopher/10'}`}>
              {v ?? '·'}
            </motion.div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {frame.slices.map((s) => (
            <div key={s.name} className="flex items-center gap-3 font-mono text-xs">
              <span className={`w-4 ${s.stale ? 'text-muted' : 'text-sky'}`}>{s.name}</span>
              <div className="flex gap-1">
                {Array.from({ length: s.cap }).map((_, idx) => (
                  <motion.div key={idx} layout className={`h-3 w-12 rounded-sm ${idx < s.len ? (s.stale ? 'bg-muted/50' : 'bg-sky') : 'bg-edge'}`} />
                ))}
              </div>
              <span className="text-muted">len {s.len} · cap {s.cap}{s.stale ? ' · old array' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <p data-testid="diagram-caption" className="mt-3 rounded-xl border border-edge bg-surface p-3 text-sm">
        <span className="mr-2 font-mono text-muted">{i + 1}/{FRAMES.length}</span>
        <span className="font-mono text-sun">{frame.code}</span> — {frame.caption}
        {i === last && <span className="ml-1 text-muted">(t: cap 6)</span>}
      </p>
    </div>
  )
}
