import { useId, useState } from 'react'
import type { DiagramProps } from './registry'

type Node = { id: string; label: string; x: number; y: number }
type View = { label: string; title: string; description: string; nodes: Node[]; edges: [string, string][] }
const views: View[] = [
  {
    label: 'Imports', title: 'Selected package imports: orders depends on domain contracts',
    description: 'Arrows mean “imports.” Orders names billing.Quote, customers validation/errors, and money.Amount. It does not import the concrete identity or payments clients. Neither billing nor customers imports orders.',
    nodes: [{ id: 'orders', label: 'orders', x: 290, y: 20 }, { id: 'customers', label: 'customers', x: 20, y: 200 }, { id: 'money', label: 'money', x: 290, y: 200 }, { id: 'billing', label: 'billing', x: 560, y: 200 }],
    edges: [['orders', 'customers'], ['orders', 'money'], ['orders', 'billing']],
  },
  {
    label: 'Request', title: 'Runtime calls: one order quote',
    description: 'Arrows mean “calls.” HTTP delegates to orders, which first checks identity through CustomerDirectory. Only an existing customer reaches billing through Quoter; billing asks payments for a fee. Runtime calls through interfaces do not require imports of those concrete clients.',
    nodes: [{ id: 'httpapi', label: 'HTTP handler', x: 20, y: 20 }, { id: 'orders', label: 'orders', x: 290, y: 20 }, { id: 'identity', label: 'identity client', x: 560, y: 20 }, { id: 'billing', label: 'billing', x: 290, y: 200 }, { id: 'payments', label: 'payments client', x: 560, y: 200 }],
    edges: [['httpapi', 'orders'], ['orders', 'identity'], ['orders', 'billing'], ['billing', 'payments']],
  },
  {
    label: 'Startup', title: 'One identity client, two consumer interfaces',
    description: 'App constructs one identity client and injects that same instance into customers and orders. Customers uses LookupName; orders uses Exists. Both borrow it. App owns the shared HTTP transport and closes idle connections after server shutdown.',
    nodes: [{ id: 'app', label: 'app constructs', x: 290, y: 0 }, { id: 'identity', label: 'one identity client', x: 290, y: 105 }, { id: 'customers', label: 'customers: Directory', x: 20, y: 220 }, { id: 'orders', label: 'orders: Directory', x: 560, y: 220 }],
    edges: [['app', 'identity'], ['identity', 'customers'], ['identity', 'orders']],
  },
]

export default function ServiceDependencies(_: DiagramProps) {
  const [selected, setSelected] = useState(0)
  const id = useId().replaceAll(':', '')
  const view = views[selected]!
  const nodes = new Map(view.nodes.map(node => [node.id, node]))
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-wide text-muted">Diagram · service boundaries</p>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Diagram view">
        {views.map((item, index) => <button key={item.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`rounded-lg border px-3 py-2 text-sm ${selected === index ? 'border-gopher bg-gopher/15 text-text' : 'border-edge bg-surface text-muted hover:border-gopher'}`}>{item.label}</button>)}
      </div>
      <p className="mb-2 text-sm font-medium" aria-live="polite">{view.title}</p>
      <div className="overflow-x-auto rounded-xl border border-edge bg-surface p-2">
        <svg viewBox="0 0 760 300" className="min-w-[600px] w-full" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
          <title id={`${id}-title`}>{view.title}</title>
          <desc id={`${id}-desc`}>{view.description} Connections: {view.edges.map(([from, to]) => `${nodes.get(from)!.label} to ${nodes.get(to)!.label}`).join('; ')}.</desc>
          <defs><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="currentColor" /></marker></defs>
          {view.edges.map(([from, to]) => {
            const a = nodes.get(from)!, b = nodes.get(to)!
            const horizontal = a.y === b.y
            return <line key={`${from}-${to}`} x1={a.x + (horizontal ? 180 : 90)} y1={a.y + (horizontal ? 27 : 54)} x2={b.x + (horizontal ? -4 : 90)} y2={b.y + (horizontal ? 27 : -5)} stroke="currentColor" strokeWidth="2" className="text-gopher" markerEnd={`url(#${id}-arrow)`} />
          })}
          {view.nodes.map(node => <g key={node.id}>
            <rect x={node.x} y={node.y} width="180" height="54" rx="10" className="fill-surface-2 stroke-gopher" />
            <text x={node.x + 90} y={node.y + 32} textAnchor="middle" className="fill-text font-mono text-[12px]">{node.label}</text>
          </g>)}
        </svg>
      </div>
      <p className="mt-3 text-sm" data-testid="service-diagram-description">{view.description}</p>
    </div>
  )
}
