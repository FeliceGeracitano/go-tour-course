// Every lesson becomes its own lazy chunk; nothing is fetched at runtime
// except the chunk for the lesson being viewed.
const modules = import.meta.glob('../../../content/**/*.md', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>

export function loadLessonMarkdown(file: string): Promise<string> {
  const load = modules[`../../../content/${file}`]
  if (!load) return Promise.reject(new Error(`Unknown lesson file: ${file}`))
  return load()
}
