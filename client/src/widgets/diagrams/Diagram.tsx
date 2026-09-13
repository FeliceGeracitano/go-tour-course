import { Suspense } from 'react'
import type { DiagramData } from '../../content/schemas'
import { diagrams, isDiagramId } from './registry'

export default function Diagram({ data }: { data: DiagramData }) {
  if (!isDiagramId(data.id)) {
    return (
      <div role="alert" className="my-6 rounded-xl border border-fuchsia/50 bg-fuchsia/10 p-3 text-sm text-fuchsia">
        unknown diagram "{data.id}"
      </div>
    )
  }
  const Widget = diagrams[data.id]
  return (
    <section data-widget="diagram" className="my-6 rounded-2xl border border-edge bg-surface-2/40 p-3">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-surface" />}>
        <Widget props={data.props} />
      </Suspense>
    </section>
  )
}
