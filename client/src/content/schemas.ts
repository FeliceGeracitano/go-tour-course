import yaml from 'js-yaml'
import { z } from 'zod'

export const WIDGET_LANGS = ['annotate', 'trace', 'quiz', 'diagram'] as const
export type WidgetLang = (typeof WIDGET_LANGS)[number]
export function isWidgetLang(lang: string): lang is WidgetLang {
  return (WIDGET_LANGS as readonly string[]).includes(lang)
}

const CodeLangSchema = z.enum(['go', 'bash', 'text']).default('go')
export type CodeLang = z.infer<typeof CodeLangSchema>
const line = z.number().int().min(1)

export const HotspotSchema = z.object({
  line,
  match: z.string().min(1),
  occurrence: z.number().int().min(1).default(1),
  title: z.string().min(1),
  note: z.string().min(1),
  link: z.url({ protocol: /^https?$/ }).optional(),
})
export const AnnotateSchema = z.object({
  code: z.string().min(1),
  lang: CodeLangSchema,
  hotspots: z.array(HotspotSchema).min(1),
})

export const ChannelStateSchema = z.object({
  buf: z.array(z.string()),
  cap: z.number().int().min(0),
  closed: z.boolean().optional(),
})
export const TraceStepSchema = z.object({
  line,
  note: z.string().min(1),
  vars: z.record(z.string(), z.string()).optional(),
  out: z.string().optional(),
  goroutines: z.array(z.string().min(1)).optional(),
  channels: z.record(z.string(), ChannelStateSchema).optional(),
})
export const TraceSchema = z.object({
  code: z.string().min(1),
  lang: CodeLangSchema,
  steps: z.array(TraceStepSchema).min(1),
})

const options = z.array(z.string().min(1)).min(2)
export const QuizSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mcq'), question: z.string().min(1), code: z.string().min(1).optional(), options, answer: z.number().int().min(0), explain: z.string().min(1) }),
  z.object({ type: z.literal('predict'), question: z.string().min(1).default('What does this print?'), code: z.string().min(1), options, answer: z.number().int().min(0), explain: z.string().min(1) }),
  z.object({ type: z.literal('spotline'), question: z.string().min(1), code: z.string().min(1), answer: line, explain: z.string().min(1) }),
])

export const DiagramSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  props: z.record(z.string(), z.unknown()).optional(),
})

export type Hotspot = z.infer<typeof HotspotSchema>
export type AnnotateData = z.infer<typeof AnnotateSchema>
export type TraceStep = z.infer<typeof TraceStepSchema>
export type TraceData = z.infer<typeof TraceSchema>
export type QuizData = z.infer<typeof QuizSchema>
export type DiagramData = z.infer<typeof DiagramSchema>
export type WidgetData = { annotate: AnnotateData; trace: TraceData; quiz: QuizData; diagram: DiagramData }

const schemas = { annotate: AnnotateSchema, trace: TraceSchema, quiz: QuizSchema, diagram: DiagramSchema } as const

export type ParseResult<L extends WidgetLang> = { ok: true; data: WidgetData[L] } | { ok: false; error: string }

export function parseWidget<L extends WidgetLang>(lang: L, rawYaml: string): ParseResult<L> {
  let doc: unknown
  try {
    doc = yaml.load(rawYaml)
  } catch (e) {
    return { ok: false, error: `YAML: ${(e as Error).message}` }
  }
  const result = schemas[lang].safeParse(doc)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')
    return { ok: false, error: `${lang}: ${issues}` }
  }
  return { ok: true, data: result.data as WidgetData[L] }
}
