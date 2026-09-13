import { useEffect, useState, type ReactNode } from 'react'
import { codeLines } from '../content/hotspots'
import { tokenize, type Lang, type Token } from './highlighter'

export type CodeHotspot = { id: string; line: number; start: number; end: number }
export type LineMark = 'current' | 'correct' | 'wrong' | 'picked'
export type CodeViewProps = {
  code: string
  lang?: Lang
  hotspots?: CodeHotspot[]
  activeHotspotId?: string | null
  onHotspotClick?: (id: string) => void
  lineMarks?: Record<number, LineMark>
  onLineClick?: (line: number) => void
  showLineNumbers?: boolean
  className?: string
}

type Piece = { text: string; color?: string; hotspotId: string | null }

// Splits one line of text into pieces at every token boundary and hotspot
// boundary, so each piece has exactly one colour and at most one hotspot.
export function buildPieces(text: string, tokens: Token[] | undefined, spots: CodeHotspot[]): Piece[] {
  const cuts = new Set<number>([0, text.length])
  let off = 0
  for (const t of tokens ?? []) {
    off += t.content.length
    cuts.add(Math.min(off, text.length))
  }
  for (const s of spots) {
    cuts.add(Math.max(0, Math.min(s.start, text.length)))
    cuts.add(Math.max(0, Math.min(s.end, text.length)))
  }
  const points = [...cuts].sort((a, b) => a - b)
  const pieces: Piece[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!, b = points[i + 1]!
    if (a === b) continue
    let color: string | undefined
    let acc = 0
    for (const t of tokens ?? []) {
      if (a >= acc && a < acc + t.content.length) { color = t.color; break }
      acc += t.content.length
    }
    const spot = spots.find((s) => a >= s.start && a < s.end)
    pieces.push({ text: text.slice(a, b), color, hotspotId: spot?.id ?? null })
  }
  return pieces
}

const markClass: Record<LineMark, string> = {
  current: 'bg-sun/15 shadow-[inset_3px_0_0_0_var(--color-sun)]',
  correct: 'bg-aqua/20 shadow-[inset_3px_0_0_0_var(--color-aqua)]',
  wrong: 'bg-fuchsia/20 shadow-[inset_3px_0_0_0_var(--color-fuchsia)]',
  picked: 'bg-sky/15 shadow-[inset_3px_0_0_0_var(--color-sky)]',
}

export default function CodeView({
  code, lang = 'go', hotspots = [], activeHotspotId = null, onHotspotClick,
  lineMarks = {}, onLineClick, showLineNumbers = false, className = '',
}: CodeViewProps) {
  const lines = codeLines(code)
  const [tokens, setTokens] = useState<Token[][] | null>(null)

  useEffect(() => {
    let alive = true
    setTokens(null)
    tokenize(code, lang).then((t) => { if (alive) setTokens(t) })
    return () => { alive = false }
  }, [code, lang])

  const tokensMatch = tokens !== null && tokens.length === lines.length
  const clickableLines = typeof onLineClick === 'function'

  return (
    <pre className={`overflow-x-auto rounded-xl border border-edge bg-surface p-0 font-mono text-[13.5px] leading-6 ${className}`}>
      <code className="block py-3">
        {lines.map((text, i) => {
          const n = i + 1
          const mark = lineMarks[n]
          const spots = clickableLines ? [] : hotspots.filter((h) => h.line === n)
          const pieces = buildPieces(text, tokensMatch ? tokens[i] : undefined, spots)
          const content = renderPieces(pieces, activeHotspotId, onHotspotClick)
          const base = `flex min-h-6 whitespace-pre px-4 ${mark ? markClass[mark] : ''}`
          const gutter = showLineNumbers ? (
            <span data-line-number className="mr-4 w-6 select-none text-right text-muted/70">{n}</span>
          ) : null
          if (clickableLines) {
            return (
              <button key={n} type="button" data-line={n} data-mark={mark} onClick={() => onLineClick(n)}
                className={`${base} w-full text-left hover:bg-surface-2`}>
                {gutter}<span>{text.length ? content : ' '}</span>
              </button>
            )
          }
          return (
            <div key={n} data-line={n} data-mark={mark} className={base}>
              {gutter}<span>{text.length ? content : ' '}</span>
            </div>
          )
        })}
      </code>
    </pre>
  )
}

function renderPieces(pieces: Piece[], activeId: string | null, onClick?: (id: string) => void): ReactNode[] {
  const out: ReactNode[] = []
  let i = 0
  while (i < pieces.length) {
    const p = pieces[i]!
    if (p.hotspotId === null) {
      out.push(<span key={i} style={{ color: p.color }}>{p.text}</span>)
      i++
      continue
    }
    const id = p.hotspotId
    const group: Piece[] = []
    while (i < pieces.length && pieces[i]!.hotspotId === id) group.push(pieces[i++]!)
    const active = id === activeId
    out.push(
      <button key={`h-${id}`} type="button" data-hotspot-id={id} aria-pressed={active} onClick={() => onClick?.(id)}
        className={`rounded-sm border-b-2 border-dotted border-sun/80 px-px transition ${active ? 'bg-sun/25 border-solid' : 'hover:bg-sun/15'}`}>
        {group.map((g, k) => <span key={k} style={{ color: g.color }}>{g.text}</span>)}
      </button>,
    )
  }
  return out
}
