import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { diagramsPlugin } from '../src/markdown-it/diagrams'

const md = new MarkdownIt().use(diagramsPlugin)

describe('diagramsPlugin', () => {
  it('renders mermaid fence as pre.mermaid', () => {
    const out = md.render('```mermaid\ngraph TD; A-->B;\n```')
    expect(out).toContain('<pre class="mermaid">')
    expect(out).toContain('graph TD; A--&gt;B;')
  })

  it('renders dot fence as pre.graphviz', () => {
    const out = md.render('```dot\ndigraph { a -> b }\n```')
    expect(out).toContain('<pre class="graphviz">')
  })

  it('renders graphviz fence as pre.graphviz', () => {
    const out = md.render('```graphviz\ndigraph { a -> b }\n```')
    expect(out).toContain('<pre class="graphviz">')
  })

  it('leaves other languages to the default fence renderer', () => {
    const out = md.render('```js\nconst x = 1\n```')
    expect(out).not.toContain('class="mermaid"')
    expect(out).not.toContain('class="graphviz"')
    expect(out).toContain('<code')
  })

  it('escapes HTML in diagram content', () => {
    const out = md.render('```mermaid\n<script>alert(1)</script>\n```')
    expect(out).toContain('&lt;script&gt;')
    expect(out).not.toContain('<script>alert(1)</script>')
  })
})
