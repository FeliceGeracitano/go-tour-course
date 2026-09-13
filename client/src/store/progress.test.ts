import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { STORAGE_KEY, getProgress, markDone, quizKey, recordQuiz, reloadProgress, useProgress } from './progress'

beforeEach(() => { localStorage.clear(); reloadProgress() })
afterEach(() => { vi.restoreAllMocks() })

test('starts empty', () => {
  expect(getProgress()).toEqual({ lessons: {}, quizzes: {} })
})

test('markDone persists to localStorage and survives reload', () => {
  markDone('slices', true)
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).lessons.slices.done).toBe(true)
  reloadProgress()
  expect(getProgress().lessons.slices?.done).toBe(true)
  markDone('slices', false)
  expect(getProgress().lessons.slices?.done).toBe(false)
})

test('recordQuiz counts attempts and stores the latest result', () => {
  const key = quizKey('slices', 0)
  expect(key).toBe('slices#0')
  recordQuiz(key, false)
  recordQuiz(key, true)
  expect(getProgress().quizzes[key]).toEqual({ correct: true, attempts: 2 })
})

test('corrupt storage falls back to empty', () => {
  localStorage.setItem(STORAGE_KEY, '{not json')
  reloadProgress()
  expect(getProgress()).toEqual({ lessons: {}, quizzes: {} })
})

test('keeps working when storage throws', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  markDone('x', true)
  expect(getProgress().lessons.x?.done).toBe(true)
})

test('useProgress re-renders on change', () => {
  const { result } = renderHook(() => useProgress())
  expect(result.current.lessons.y).toBeUndefined()
  act(() => markDone('y', true))
  expect(result.current.lessons.y?.done).toBe(true)
})
