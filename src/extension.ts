import type MarkdownIt from 'markdown-it'
import githubAlerts from 'markdown-it-github-alerts'
import { Graphviz } from '@hpcc-js/wasm-graphviz'
import { createDiagramsPlugin } from './markdown-it/diagrams'

export async function activate() {
  // Load Graphviz in the extension host (Node) where WebAssembly is allowed.
  // extendMarkdownIt is only called after activation resolves, so the instance
  // is ready by the time fences are rendered.
  const graphviz = await Graphviz.load()
  return {
    extendMarkdownIt(md: MarkdownIt) {
      return md
        .use(githubAlerts, { matchCaseSensitive: false })
        .use(createDiagramsPlugin(graphviz))
    },
  }
}

export function deactivate(): void {}
