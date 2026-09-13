import { flattenLessons, type Course } from './manifest'
import { lineCount, locateHotspot } from './hotspots'
import { extractWidgetBlocks } from './parse'
import { parseWidget, type WidgetData, type WidgetLang } from './schemas'

export type Issue = { file: string; message: string }
export type ContentFile = { path: string; text: string }

export function validateContent(course: Course, files: ContentFile[], diagramIds: readonly string[]): Issue[] {
  const issues: Issue[] = []
  const byPath = new Map(files.map((f) => [f.path, f]))
  const lessons = flattenLessons(course)

  const seen = new Map<string, string>()
  for (const r of lessons) {
    const prev = seen.get(r.lesson.id)
    if (prev) issues.push({ file: 'course.json', message: `duplicate lesson id "${r.lesson.id}" (${prev} and ${r.chapter.id})` })
    else seen.set(r.lesson.id, r.chapter.id)
    if (!byPath.has(r.lesson.file)) issues.push({ file: 'course.json', message: `missing file ${r.lesson.file} for lesson ${r.lesson.id}` })
  }
  const listed = new Set(lessons.map((r) => r.lesson.file))
  for (const f of files) if (!listed.has(f.path)) issues.push({ file: f.path, message: 'file not in manifest' })

  for (const f of files) {
    for (const block of extractWidgetBlocks(f.text)) {
      const where = `block #${block.index + 1} (${block.lang}, line ${block.line})`
      const parsed = parseWidget(block.lang, block.raw)
      if (!parsed.ok) {
        issues.push({ file: f.path, message: `${where}: ${parsed.error}` })
        continue
      }
      for (const msg of checkBlock(block.lang, parsed.data, diagramIds)) issues.push({ file: f.path, message: `${where}: ${msg}` })
    }
  }
  return issues
}

function checkBlock(lang: WidgetLang, data: WidgetData[WidgetLang], diagramIds: readonly string[]): string[] {
  const out: string[] = []
  switch (lang) {
    case 'annotate': {
      const d = data as WidgetData['annotate']
      const n = lineCount(d.code)
      d.hotspots.forEach((h, i) => {
        if (h.line > n) out.push(`hotspot ${i + 1}: line ${h.line} beyond code (${n} lines)`)
        else if (!locateHotspot(d.code, h)) out.push(`hotspot ${i + 1}: "${h.match}" not found on line ${h.line} (occurrence ${h.occurrence})`)
      })
      break
    }
    case 'trace': {
      const d = data as WidgetData['trace']
      const n = lineCount(d.code)
      d.steps.forEach((s, i) => {
        if (s.line > n) out.push(`step ${i + 1}: line ${s.line} beyond code (${n} lines)`)
      })
      break
    }
    case 'quiz': {
      const d = data as WidgetData['quiz']
      if (d.type === 'spotline') {
        const n = lineCount(d.code)
        if (d.answer > n) out.push(`answer line ${d.answer} beyond code (${n} lines)`)
      } else if (d.answer >= d.options.length) {
        out.push(`answer ${d.answer} out of range (${d.options.length} options)`)
      }
      break
    }
    case 'diagram': {
      const d = data as WidgetData['diagram']
      if (!diagramIds.includes(d.id)) out.push(`unknown diagram "${d.id}"`)
      break
    }
  }
  return out
}
