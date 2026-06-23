import { describe, it, expect, beforeAll } from 'vitest'
import MarkdownIt from 'markdown-it'
import { Graphviz } from '@hpcc-js/wasm-graphviz'
import { createDiagramsPlugin } from '../src/markdown-it/diagrams'

let md: MarkdownIt

beforeAll(async () => {
  const graphviz = await Graphviz.load()
  md = new MarkdownIt().use(createDiagramsPlugin(graphviz))
})

describe('createDiagramsPlugin', () => {
  it('renders mermaid fence as pre.mermaid (rendered client-side)', () => {
    const out = md.render('```mermaid\ngraph TD; A-->B;\n```')
    expect(out).toContain('<pre class="mermaid">')
    expect(out).toContain('graph TD; A--&gt;B;')
  })

  it('renders dot fence to inline SVG server-side', () => {
    const out = md.render('```dot\ndigraph { a -> b }\n```')
    expect(out).toContain('<div class="graphviz">')
    expect(out).toContain('<svg')
  })

  it('renders graphviz fence to inline SVG server-side', () => {
    const out = md.render('```graphviz\ndigraph { a -> b }\n```')
    expect(out).toContain('<div class="graphviz">')
    expect(out).toContain('<svg')
  })

  it('falls back to diagram-error on invalid dot', () => {
    const out = md.render('```dot\nthis is not valid dot @@@\n```')
    expect(out).toContain('class="diagram-error"')
  })

  it('leaves other languages to the default fence renderer', () => {
    const out = md.render('```js\nconst x = 1\n```')
    expect(out).not.toContain('class="mermaid"')
    expect(out).not.toContain('class="graphviz"')
    expect(out).toContain('<code')
  })

  it('escapes HTML in mermaid content', () => {
    const out = md.render('```mermaid\n<script>alert(1)</script>\n```')
    expect(out).toContain('&lt;script&gt;')
    expect(out).not.toContain('<script>alert(1)</script>')
  })
})
