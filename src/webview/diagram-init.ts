import mermaid from 'mermaid'

// Graphviz is rendered server-side (extension host); this script only renders
// mermaid, which needs a DOM. mermaid.run() handles insertion and sizing and is
// the pattern VS Code's own mermaid extension uses.
mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })

let running = false
let rerunQueued = false

async function renderMermaid(): Promise<void> {
  if (running) {
    rerunQueued = true
    return
  }
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('pre.mermaid:not([data-processed])'),
  )
  if (nodes.length === 0) return

  running = true
  try {
    await mermaid.run({ nodes })
  } catch (e) {
    console.error('pretty-md-reader: mermaid render failed', e)
  } finally {
    running = false
    if (rerunQueued) {
      rerunQueued = false
      void renderMermaid()
    }
  }
}

// VS Code replaces the preview body on content updates (live edits), producing
// fresh unprocessed pre.mermaid elements. Re-run when the DOM changes.
const observer = new MutationObserver(() => void renderMermaid())
observer.observe(document.body, { childList: true, subtree: true })
void renderMermaid()
