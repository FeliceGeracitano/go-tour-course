import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from '../code/CodeBlock'
import type { Lang } from '../code/highlighter'
import { extractWidgetBlocks, type WidgetBlock } from '../content/parse'
import { isWidgetLang, parseWidget, type WidgetLang } from '../content/schemas'
import { quizKey } from '../store/progress'
import Annotate from '../widgets/Annotate/Annotate'
import Quiz from '../widgets/Quiz/Quiz'
import Trace from '../widgets/Trace/Trace'
import Diagram from '../widgets/diagrams/Diagram'

export default function LessonMarkdown({ markdown, lessonId }: { markdown: string; lessonId: string }) {
  // Fence line → block, so a quiz knows its index within the lesson (progress key).
  const blocksByLine = useMemo(() => new Map(extractWidgetBlocks(markdown).map((b) => [b.line, b])), [markdown])

  const components: Components = {
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children, node }) => {
      const match = /language-([\w-]+)/.exec(className ?? '')
      if (!match) {
        return <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-sky">{children}</code>
      }
      const lang = match[1]!
      const text = String(children ?? '').replace(/\n$/, '')
      if (isWidgetLang(lang)) {
        const line = node?.position?.start.line
        return <Widget lang={lang} raw={text} block={line === undefined ? undefined : blocksByLine.get(line)} lessonId={lessonId} />
      }
      const codeLang: Lang = lang === 'go' || lang === 'bash' ? lang : 'text'
      return <CodeBlock code={text} lang={codeLang} />
    },
  }

  return (
    <div className="prose-go">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{markdown}</ReactMarkdown>
    </div>
  )
}

function Widget({ lang, raw, block, lessonId }: { lang: WidgetLang; raw: string; block?: WidgetBlock; lessonId: string }) {
  switch (lang) {
    case 'annotate': {
      const r = parseWidget('annotate', raw)
      return r.ok ? <Annotate data={r.data} /> : <WidgetError lang={lang} error={r.error} />
    }
    case 'trace': {
      const r = parseWidget('trace', raw)
      return r.ok ? <Trace data={r.data} /> : <WidgetError lang={lang} error={r.error} />
    }
    case 'quiz': {
      const r = parseWidget('quiz', raw)
      if (!r.ok) return <WidgetError lang={lang} error={r.error} />
      const key = quizKey(lessonId, block?.quizIndex ?? 0)
      return <div data-quiz-key={key}><Quiz data={r.data} quizKey={key} /></div>
    }
    case 'diagram': {
      const r = parseWidget('diagram', raw)
      return r.ok ? <Diagram data={r.data} /> : <WidgetError lang={lang} error={r.error} />
    }
  }
}

function WidgetError({ lang, error }: { lang: string; error: string }) {
  return (
    <div role="alert" className="my-6 rounded-xl border border-fuchsia/50 bg-fuchsia/10 p-3 font-mono text-xs text-fuchsia">
      Invalid <strong>{lang}</strong> block: {error}
    </div>
  )
}
