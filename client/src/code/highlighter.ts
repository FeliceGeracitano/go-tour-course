import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import go from 'shiki/langs/go.mjs'
import bash from 'shiki/langs/bash.mjs'
import oneDarkPro from 'shiki/themes/one-dark-pro.mjs'

// Fine-grained Shiki: only go + bash and one theme are bundled; the JS regex
// engine avoids shipping the Oniguruma wasm.
export type Lang = 'go' | 'bash' | 'text'
export type Token = { content: string; color?: string }
export const THEME = 'one-dark-pro'

let highlighterPromise: Promise<HighlighterCore> | null = null
function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [oneDarkPro],
      langs: [go, bash],
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighterPromise
}

// Returns one token list per line, or null when the code should render as plain text.
export async function tokenize(code: string, lang: Lang): Promise<Token[][] | null> {
  if (lang === 'text') return null
  try {
    const hl = await getHighlighter()
    const lines = hl.codeToTokensBase(code.replace(/\n$/, ''), { lang, theme: THEME })
    return lines.map((line) => line.map((t) => ({ content: t.content, color: t.color })))
  } catch {
    return null
  }
}
