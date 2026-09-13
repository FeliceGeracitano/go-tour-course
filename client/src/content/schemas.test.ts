import { describe, expect, test } from 'vitest'
import { isWidgetLang, parseWidget } from './schemas'

describe('isWidgetLang', () => {
  test('recognises the four widget fences only', () => {
    expect(isWidgetLang('annotate')).toBe(true)
    expect(isWidgetLang('quiz')).toBe(true)
    expect(isWidgetLang('go')).toBe(false)
  })
})

describe('parseWidget annotate', () => {
  test('applies defaults (lang go, occurrence 1)', () => {
    const r = parseWidget('annotate', 'code: "x := 1"\nhotspots:\n  - { line: 1, match: ":=", title: T, note: N }')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.lang).toBe('go')
      expect(r.data.hotspots[0]?.occurrence).toBe(1)
    }
  })
  test('rejects empty hotspots and bad link', () => {
    expect(parseWidget('annotate', 'code: x\nhotspots: []').ok).toBe(false)
    expect(parseWidget('annotate', 'code: x\nhotspots:\n  - { line: 1, match: x, title: T, note: N, link: "notaurl" }').ok).toBe(false)
  })
  test('reports YAML syntax errors as ok:false', () => {
    const r = parseWidget('annotate', 'code: [unclosed')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/yaml/i)
  })
})

describe('parseWidget trace', () => {
  test('accepts steps with optional vars/out/goroutines/channels', () => {
    const r = parseWidget('trace', [
      'code: |',
      '  ch := make(chan int, 1)',
      '  ch <- 1',
      'steps:',
      '  - { line: 1, note: make, channels: { ch: { buf: [], cap: 1 } } }',
      '  - { line: 2, note: send, out: "", channels: { ch: { buf: ["1"], cap: 1 } }, goroutines: [main] }',
    ].join('\n'))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.steps[1]?.channels?.ch?.buf).toEqual(['1'])
  })
  test('rejects a step without a note', () => {
    expect(parseWidget('trace', 'code: x\nsteps:\n  - { line: 1 }').ok).toBe(false)
  })
})

describe('parseWidget quiz', () => {
  test('predict defaults the question and requires code', () => {
    const ok = parseWidget('quiz', 'type: predict\ncode: "fmt.Println(1)"\noptions: ["1", "2"]\nanswer: 0\nexplain: e')
    expect(ok.ok).toBe(true)
    if (ok.ok && ok.data.type === 'predict') expect(ok.data.question).toBe('What does this print?')
    expect(parseWidget('quiz', 'type: predict\noptions: ["1", "2"]\nanswer: 0\nexplain: e').ok).toBe(false)
  })
  test('mcq needs at least two options', () => {
    expect(parseWidget('quiz', 'type: mcq\nquestion: q\noptions: ["only"]\nanswer: 0\nexplain: e').ok).toBe(false)
  })
  test('spotline needs code and a positive line answer', () => {
    expect(parseWidget('quiz', 'type: spotline\nquestion: q\ncode: "a\\nb"\nanswer: 2\nexplain: e').ok).toBe(true)
    expect(parseWidget('quiz', 'type: spotline\nquestion: q\ncode: "a"\nanswer: 0\nexplain: e').ok).toBe(false)
  })
  test('unknown type is rejected', () => {
    expect(parseWidget('quiz', 'type: essay\nquestion: q\nexplain: e').ok).toBe(false)
  })
})

describe('parseWidget diagram', () => {
  test('accepts id with optional props', () => {
    const r = parseWidget('diagram', 'id: slices-backing-array\nprops: { cap: 4 }')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.props).toEqual({ cap: 4 })
  })
})
