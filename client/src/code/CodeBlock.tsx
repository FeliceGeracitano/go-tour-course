import { useState } from 'react'
import CodeView from './CodeView'
import type { Lang } from './highlighter'

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch { return false }
}

export default function CodeBlock({ code, lang }: { code: string; lang: Lang }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    if (await copyText(code)) { setCopied(true); setTimeout(() => setCopied(false), 1400) }
  }
  return (
    <div className="group relative my-4">
      <button type="button" onClick={copy} aria-label="Copy code"
        className={`absolute right-2 top-2 z-10 rounded-md border px-2 py-1 text-xs font-medium opacity-70 transition group-hover:opacity-100 ${copied ? 'border-aqua/50 bg-aqua/15 text-aqua' : 'border-edge bg-surface-2 text-muted hover:text-text'}`}>
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <CodeView code={code} lang={lang} />
    </div>
  )
}
