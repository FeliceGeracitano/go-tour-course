import { describe, expect, test } from 'vitest'
import { course, findLesson, flattenLessons, lessonPath, parseCourse } from './manifest'

describe('parseCourse', () => {
  test('accepts a minimal valid manifest', () => {
    const c = parseCourse({
      title: 'T',
      parts: [{ id: 'p', title: 'P', chapters: [{ id: 'c', title: 'C', lessons: [{ id: 'l', title: 'L', file: 'p/c/l.md', ref: 'https://go.dev/tour' }] }] }],
    })
    expect(c.parts[0]?.chapters[0]?.lessons[0]?.id).toBe('l')
  })

  test('rejects a non-https ref', () => {
    expect(() =>
      parseCourse({ title: 'T', parts: [{ id: 'p', title: 'P', chapters: [{ id: 'c', title: 'C', lessons: [{ id: 'l', title: 'L', file: 'x.md', ref: 'ftp://x' }] }] }] }),
    ).toThrow()
  })
})

describe('real manifest', () => {
  test('has three parts in order', () => {
    expect(course.parts.map((p) => p.id)).toEqual(['part1_tour', 'part2_patterns', 'part3_toolchain'])
  })

  test('lesson ids are unique within the course', () => {
    const ids = flattenLessons(course).map((r) => `${r.part.id}/${r.chapter.id}/${r.lesson.id}`)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('flattenLessons indexes in manifest order and findLesson round-trips', () => {
    const all = flattenLessons(course)
    expect(all[0]?.lesson.id).toBe('install_hello')
    const found = findLesson(course, 'part1_tour', 'ch03_more_types', 'slices')
    expect(found?.lesson.title).toBe('Slices')
    expect(all[found!.index]).toBe(found)
    expect(lessonPath(found!)).toBe('/part1_tour/ch03_more_types/slices')
  })

  test('every part2 lesson carries tags and a problem line', () => {
    const part2 = course.parts.find((p) => p.id === 'part2_patterns')!
    for (const ch of part2.chapters) for (const l of ch.lessons) {
      expect(l.tags?.length, l.id).toBeGreaterThan(0)
      expect(l.problem, l.id).toBeTruthy()
    }
  })
})
