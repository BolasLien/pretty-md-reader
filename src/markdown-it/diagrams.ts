import type MarkdownIt from 'markdown-it'
import type { Graphviz } from '@hpcc-js/wasm-graphviz'

/**
 * Fence handling for diagrams.
 *
 * - `mermaid` blocks are emitted as `<pre class="mermaid">` and rendered in the
 *   webview (mermaid needs a DOM).
 * - `dot` / `graphviz` blocks are rendered to SVG HERE, in the Node extension
 *   host, because the built-in preview's CSP (`script-src 'nonce-…'`, no
 *   `unsafe-eval`) blocks WebAssembly in the webview. The inline SVG needs no
 *   script to display.
 */
export function createDiagramsPlugin(graphviz: Graphviz) {
  return (md: MarkdownIt): void => {
    const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules)

    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const info = token.info.trim().split(/\s+/)[0].toLowerCase()

      if (info === 'mermaid') {
        return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>\n`
      }

      if (info === 'dot' || info === 'graphviz') {
        try {
          const out = graphviz.dot(token.content)
          // Drop the XML prolog / DOCTYPE so only the <svg> is inlined into HTML.
          const svg = out.slice(out.indexOf('<svg'))
          return `<div class="graphviz">${svg}</div>\n`
        } catch {
          return `<pre class="diagram-error">${md.utils.escapeHtml(token.content)}</pre>\n`
        }
      }

      return defaultFence(tokens, idx, options, env, self)
    }
  }
}
