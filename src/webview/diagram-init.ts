import mermaid from 'mermaid'
import { Graphviz } from '@hpcc-js/wasm-graphviz'

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })

let graphvizPromise: Promise<Graphviz> | null = null
const getGraphviz = () => (graphvizPromise ??= Graphviz.load())

function showError(el: HTMLElement, src: string): void {
  el.innerHTML = ''
  const pre = document.createElement('pre')
  pre.className = 'diagram-error'
  pre.textContent = src
  el.appendChild(pre)
}

async function renderMermaid(el: HTMLElement): Promise<void> {
  if (el.dataset.rendered) return
  el.dataset.rendered = '1'
  const src = el.textContent ?? ''
  try {
    const id = 'm' + Math.random().toString(36).slice(2)
    const { svg } = await mermaid.render(id, src)
    el.innerHTML = svg
  } catch (e) {
    console.error('pretty-md-reader: failed to render mermaid diagram', e)
    showError(el, src)
  }
  el.classList.add('diagram-rendered')
}

async function renderGraphviz(el: HTMLElement): Promise<void> {
  if (el.dataset.rendered) return
  el.dataset.rendered = '1'
  const src = el.textContent ?? ''
  try {
    const gv = await getGraphviz()
    el.innerHTML = gv.dot(src)
  } catch (e) {
    console.error('pretty-md-reader: failed to render graphviz diagram', e)
    showError(el, src)
  }
  el.classList.add('diagram-rendered')
}

function renderAll(): void {
  document
    .querySelectorAll<HTMLElement>('pre.mermaid:not(.diagram-rendered)')
    .forEach((el) => void renderMermaid(el))
  document
    .querySelectorAll<HTMLElement>('pre.graphviz:not(.diagram-rendered)')
    .forEach((el) => void renderGraphviz(el))
}

const observer = new MutationObserver(() => renderAll())
observer.observe(document.body, { childList: true, subtree: true })
renderAll()
