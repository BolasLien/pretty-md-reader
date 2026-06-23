import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { activate } from '../src/extension'

describe('extendMarkdownIt', () => {
  const md = activate().extendMarkdownIt(new MarkdownIt())

  it('renders GitHub/Obsidian callouts via github-alerts', () => {
    expect(md.render('> [!note]\n> hi')).toContain('markdown-alert')
  })

  it('supports lowercase Obsidian callout markers', () => {
    expect(md.render('> [!tip]\n> hi')).toContain('markdown-alert')
  })

  it('rewrites mermaid fences via the diagrams plugin', () => {
    expect(md.render('```mermaid\nA-->B\n```')).toContain('<pre class="mermaid">')
  })

  it('rewrites dot fences to graphviz', () => {
    expect(md.render('```dot\ndigraph{a->b}\n```')).toContain('<pre class="graphviz">')
  })

  it('renders all five GitHub alert types with distinct classes', () => {
    const types = ['note', 'tip', 'important', 'warning', 'caution'] as const
    for (const t of types) {
      const html = md.render(`> [!${t}]\n> body`)
      expect(html).toContain(`markdown-alert-${t}`)
    }
  })
})
