import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export const DIAGRAM_IDS = ['slices-backing-array'] as const
export type DiagramId = (typeof DIAGRAM_IDS)[number]
export type DiagramProps = { props?: Record<string, unknown> }

export function isDiagramId(id: string): id is DiagramId {
  return (DIAGRAM_IDS as readonly string[]).includes(id)
}

export const diagrams: Record<DiagramId, LazyExoticComponent<ComponentType<DiagramProps>>> = {
  'slices-backing-array': lazy(() => import('./SlicesBackingArray')),
}
