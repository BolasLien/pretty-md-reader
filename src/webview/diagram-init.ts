import mermaid from 'mermaid'

// Graphviz is rendered server-side; this script only renders mermaid (it needs
// a DOM). securityLevel 'strict' avoids executing any script in diagram input.
mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })

// mermaid sizes a diagram by measuring its text. In the VS Code preview webview
// the script can run before the fonts are ready; measuring then yields zero-width
// text and the whole diagram collapses to an invisible/empty SVG. Waiting for the
// fonts avoids that.
const fontsReady: Promise<unknown> = document.fonts?.ready ?? Promise.resolve()

async function renderMermaid(): Promise<void> {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('pre.mermaid:not([data-processed])'),
  )
  if (nodes.length === 0) return
  await fontsReady

  for (const el of nodes) {
    if (el.dataset.processed) continue
    el.dataset.processed = '1'
    const src = el.textContent ?? ''
    try {
      const id = 'pmr-mermaid-' + Math.random().toString(36).slice(2)
      const { svg } = await mermaid.render(id, src)
      el.innerHTML = svg
    } catch (e) {
      // Never leave an empty box: show the source so the diagram is at least readable.
      console.error('pretty-md-reader: mermaid render failed', e)
      el.textContent = src
      el.classList.add('diagram-error')
    }
  }
}

// VS Code replaces the preview body on content updates, producing fresh
// unprocessed pre.mermaid elements; re-render when the DOM changes.
const observer = new MutationObserver(() => void renderMermaid())
observer.observe(document.documentElement, { childList: true, subtree: true })

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void renderMermaid())
} else {
  void renderMermaid()
}
