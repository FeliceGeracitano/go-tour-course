export default function ProgressRing({ done, total, size = 18 }: { done: number; total: number; size?: number }) {
  const r = (size - 3) / 2
  const c = 2 * Math.PI * r
  const frac = total === 0 ? 0 : done / total
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${done} of ${total} done`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-edge)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={frac === 1 ? 'var(--color-aqua)' : 'var(--color-gopher)'} strokeWidth={3}
        strokeDasharray={c} strokeDashoffset={c * (1 - frac)} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  )
}
