import type { Code, Root } from 'mdast'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { isWidgetLang, type WidgetLang } from './schemas'

export type WidgetBlock = { lang: WidgetLang; raw: string; line: number; index: number; quizIndex?: number }

const parser = unified().use(remarkParse)

function walk(node: { type: string; children?: unknown[] }, visit: (code: Code) => void) {
  if (node.type === 'code') visit(node as unknown as Code)
  for (const child of (node.children ?? []) as { type: string; children?: unknown[] }[]) walk(child, visit)
}

export function extractWidgetBlocks(markdown: string): WidgetBlock[] {
  const tree = parser.parse(markdown) as Root
  const blocks: WidgetBlock[] = []
  let quizzes = 0
  walk(tree, (code) => {
    const lang = code.lang ?? ''
    if (!isWidgetLang(lang)) return
    const block: WidgetBlock = {
      lang,
      raw: code.value,
      line: code.position?.start.line ?? 0,
      index: blocks.length,
    }
    if (lang === 'quiz') block.quizIndex = quizzes++
    blocks.push(block)
  })
  return blocks
}
