export type HotspotRange = { line: number; start: number; end: number }

export function codeLines(code: string): string[] {
  return code.replace(/\n$/, '').split('\n')
}

export function lineCount(code: string): number {
  return codeLines(code).length
}

// Finds the `occurrence`-th (1-based) `match` on 1-based `line`.
export function locateHotspot(
  code: string,
  h: { line: number; match: string; occurrence: number },
): HotspotRange | null {
  const text = codeLines(code)[h.line - 1]
  if (text === undefined || h.match.length === 0) return null
  let from = 0
  for (let n = 0; n < h.occurrence; n++) {
    const at = text.indexOf(h.match, from)
    if (at === -1) return null
    if (n === h.occurrence - 1) return { line: h.line, start: at, end: at + h.match.length }
    from = at + 1
  }
  return null
}
