import { useState } from 'react'
import CodeView, { type LineMark } from '../../code/CodeView'
import type { QuizData } from '../../content/schemas'
import { recordQuiz, useProgress } from '../../store/progress'

export default function Quiz({ data, quizKey }: { data: QuizData; quizKey: string }) {
  const [picked, setPicked] = useState<number | null>(null)
  const saved = useProgress().quizzes[quizKey]
  const answered = picked !== null
  const correct = answered && picked === data.answer

  function pick(choice: number) {
    if (answered) return
    setPicked(choice)
    recordQuiz(quizKey, choice === data.answer)
  }

  return (
    <section data-widget="quiz" className="my-6 rounded-2xl border border-edge bg-surface-2/40 p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">Quiz</div>
          <p className="mt-1 font-medium">{data.question}</p>
        </div>
        {saved && !answered && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${saved.correct ? 'border-aqua/50 text-aqua' : 'border-fuchsia/50 text-fuchsia'}`}>
            {saved.correct ? 'Answered correctly before' : 'Answered before'} · {saved.attempts} {saved.attempts === 1 ? 'attempt' : 'attempts'}
          </span>
        )}
      </header>

      {data.type === 'spotline' ? (
        <CodeView
          code={data.code}
          showLineNumbers
          onLineClick={pick}
          lineMarks={answered ? spotMarks(picked, data.answer) : {}}
        />
      ) : (
        <>
          {data.code && <CodeView code={data.code} className="mb-3" />}
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.options.map((opt, i) => {
              const state = !answered ? 'idle' : i === data.answer ? 'correct' : i === picked ? 'wrong' : 'idle'
              return (
                <li key={i}>
                  <button type="button" data-state={state} disabled={answered} onClick={() => pick(i)}
                    className={`w-full rounded-xl border px-3 py-2 text-left font-mono text-sm transition disabled:cursor-default ${
                      state === 'correct' ? 'border-aqua bg-aqua/15 text-aqua'
                      : state === 'wrong' ? 'border-fuchsia bg-fuchsia/15 text-fuchsia'
                      : 'border-edge bg-surface hover:border-gopher'}`}>
                    {opt}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {answered && (
        <div data-testid="quiz-result" className={`mt-3 rounded-xl border p-3 text-sm ${correct ? 'border-aqua/50 bg-aqua/10' : 'border-fuchsia/50 bg-fuchsia/10'}`}>
          <p className="font-semibold">
            {correct ? '✓ Correct!' : data.type === 'spotline' ? `✗ Not quite — it's line ${data.answer}.` : '✗ Not quite.'}
          </p>
          <p className="mt-1 text-text/90">{data.explain}</p>
          <button type="button" onClick={() => setPicked(null)} className="mt-2 text-xs text-sky underline underline-offset-4">
            Try again
          </button>
        </div>
      )}
    </section>
  )
}

function spotMarks(picked: number | null, answer: number): Record<number, LineMark> {
  const marks: Record<number, LineMark> = { [answer]: 'correct' }
  if (picked !== null && picked !== answer) marks[picked] = 'wrong'
  return marks
}
