import { expect, test } from 'vitest'
import { lineCount, locateHotspot } from './hotspots'

const code = 'x := 1\ny := x + x\n'

test('lineCount ignores a single trailing newline', () => {
  expect(lineCount(code)).toBe(2)
  expect(lineCount('a')).toBe(1)
})

test('locates the first occurrence on the given line', () => {
  expect(locateHotspot(code, { line: 2, match: 'x', occurrence: 1 })).toEqual({ line: 2, start: 5, end: 6 })
})

test('locates the nth occurrence', () => {
  expect(locateHotspot(code, { line: 2, match: 'x', occurrence: 2 })).toEqual({ line: 2, start: 9, end: 10 })
})

test('returns null when the line or match does not exist', () => {
  expect(locateHotspot(code, { line: 3, match: 'x', occurrence: 1 })).toBeNull()
  expect(locateHotspot(code, { line: 1, match: 'zzz', occurrence: 1 })).toBeNull()
  expect(locateHotspot(code, { line: 2, match: 'x', occurrence: 3 })).toBeNull()
})
