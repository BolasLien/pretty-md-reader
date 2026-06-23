import type MarkdownIt from 'markdown-it'

const DIAGRAM_LANGS: Record<string, string> = {
  mermaid: 'mermaid',
  dot: 'graphviz',
  graphviz: 'graphviz',
}

export function diagramsPlugin(md: MarkdownIt): void {
  const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info.trim().split(/\s+/)[0].toLowerCase()
    const kind = DIAGRAM_LANGS[info]
    if (!kind) return defaultFence(tokens, idx, options, env, self)
    return `<pre class="${kind}">${md.utils.escapeHtml(token.content)}</pre>\n`
  }
}
