import { describe, it, expect, beforeAll } from 'vitest'
import MarkdownIt from 'markdown-it'
import { activate } from '../src/extension'

let md: MarkdownIt

beforeAll(async () => {
  md = (await activate()).extendMarkdownIt(new MarkdownIt())
})

describe('extendMarkdownIt', () => {
  it('renders GitHub/Obsidian callouts via github-alerts', () => {
    expect(md.render('> [!note]\n> hi')).toContain('markdown-alert')
  })

  it('supports lowercase Obsidian callout markers', () => {
    expect(md.render('> [!tip]\n> hi')).toContain('markdown-alert')
  })

  it('rewrites mermaid fences to pre.mermaid', () => {
    expect(md.render('```mermaid\nA-->B\n```')).toContain('<pre class="mermaid">')
  })

  it('renders dot fences to inline SVG', () => {
    const out = md.render('```dot\ndigraph{a->b}\n```')
    expect(out).toContain('<div class="graphviz">')
    expect(out).toContain('<svg')
  })

  it('renders all five GitHub alert types with distinct classes', () => {
    const types = ['note', 'tip', 'important', 'warning', 'caution'] as const
    for (const t of types) {
      const html = md.render(`> [!${t}]\n> body`)
      expect(html).toContain(`markdown-alert-${t}`)
    }
  })
})
