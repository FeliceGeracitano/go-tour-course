import { useSyncExternalStore } from 'react'
import { z } from 'zod'

export const STORAGE_KEY = 'go-tour-course:v1'

const ProgressSchema = z.object({
  lessons: z.record(z.string(), z.object({ done: z.boolean(), doneAt: z.string() })),
  quizzes: z.record(z.string(), z.object({ correct: z.boolean(), attempts: z.number().int().min(0) })),
})
export type Progress = z.infer<typeof ProgressSchema>

const EMPTY: Progress = { lessons: {}, quizzes: {} }
let state: Progress = read()
const listeners = new Set<() => void>()

function read(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    return ProgressSchema.parse(JSON.parse(raw))
  } catch {
    return EMPTY
  }
}

function commit(next: Progress) {
  state = next
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* storage unavailable: keep in memory */ }
  for (const l of listeners) l()
}

export function getProgress(): Progress { return state }
export function reloadProgress(): void { state = read(); for (const l of listeners) l() }
export function quizKey(lessonId: string, quizIndex: number): string { return `${lessonId}#${quizIndex}` }

export function markDone(lessonId: string, done: boolean): void {
  commit({ ...state, lessons: { ...state.lessons, [lessonId]: { done, doneAt: new Date().toISOString() } } })
}

export function recordQuiz(key: string, correct: boolean): void {
  const prev = state.quizzes[key]
  commit({ ...state, quizzes: { ...state.quizzes, [key]: { correct, attempts: (prev?.attempts ?? 0) + 1 } } })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress, getProgress)
}
