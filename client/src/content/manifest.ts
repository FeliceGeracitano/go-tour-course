import { z } from 'zod'
import raw from '../../../content/course.json'

const slug = z.string().regex(/^[a-z0-9_]+$/, 'ids are lowercase snake_case')

export const LessonSchema = z.object({
  id: slug,
  number: z.string().optional(),
  title: z.string().min(1),
  file: z.string().regex(/\.md$/),
  ref: z.url({ protocol: /^https$/ }),
  tags: z.array(z.string().min(1)).optional(),
  problem: z.string().min(1).optional(),
})
export const ChapterSchema = z.object({
  id: slug,
  number: z.number().int().min(0).optional(),
  title: z.string().min(1),
  lessons: z.array(LessonSchema).min(1),
})
export const PartSchema = z.object({ id: slug, title: z.string().min(1), chapters: z.array(ChapterSchema).min(1) })
export const CourseSchema = z.object({ title: z.string().min(1), parts: z.array(PartSchema).min(1) })

export type Lesson = z.infer<typeof LessonSchema>
export type Chapter = z.infer<typeof ChapterSchema>
export type Part = z.infer<typeof PartSchema>
export type Course = z.infer<typeof CourseSchema>
export type LessonRef = { part: Part; chapter: Chapter; lesson: Lesson; index: number }

export function parseCourse(json: unknown): Course {
  return CourseSchema.parse(json)
}

// Memoized per course object so repeated calls (e.g. from findLesson) return
// the same LessonRef instances, letting callers compare results with `toBe`.
const flattenCache = new WeakMap<Course, LessonRef[]>()

export function flattenLessons(course: Course): LessonRef[] {
  const cached = flattenCache.get(course)
  if (cached) return cached
  const out: LessonRef[] = []
  for (const part of course.parts)
    for (const chapter of part.chapters)
      for (const lesson of chapter.lessons) out.push({ part, chapter, lesson, index: out.length })
  flattenCache.set(course, out)
  return out
}

export function findLesson(course: Course, partId: string, chapterId: string, lessonId: string): LessonRef | undefined {
  return flattenLessons(course).find(
    (r) => r.part.id === partId && r.chapter.id === chapterId && r.lesson.id === lessonId,
  )
}

export function lessonPath(ref: LessonRef): string {
  return `/${ref.part.id}/${ref.chapter.id}/${ref.lesson.id}`
}

export const course: Course = parseCourse(raw)
