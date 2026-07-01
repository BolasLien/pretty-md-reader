import type MarkdownIt from 'markdown-it'
import githubAlerts from 'markdown-it-github-alerts'
import { Graphviz } from '@hpcc-js/wasm-graphviz'
import { createDiagramsPlugin } from './markdown-it/diagrams'
import { buildThemeStyle } from './themes'

// Reads the user's chosen theme from VS Code settings. `vscode` is only
// resolvable inside the extension host, so the require is guarded: in unit
// tests (no vscode module) it throws and we fall back to the default theme.
function getConfiguredTheme(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vscode = require('vscode')
    return vscode.workspace.getConfiguration('prettyMdReader').get('theme') ?? 'purple'
  } catch {
    return 'purple'
  }
}

export async function activate() {
  // Load Graphviz in the extension host (Node) where WebAssembly is allowed.
  // extendMarkdownIt is only called after activation resolves, so the instance
  // is ready by the time fences are rendered.
  const graphviz = await Graphviz.load()
  return {
    extendMarkdownIt(md: MarkdownIt) {
      md.use(githubAlerts, { matchCaseSensitive: false }).use(createDiagramsPlugin(graphviz))
      // Prepend the chosen theme's accent overrides to each full-document render.
      // Reading config per render means a preview refresh picks up the latest value.
      const render = md.render.bind(md)
      md.render = (src, env) => buildThemeStyle(getConfiguredTheme()) + render(src, env)
      return md
    },
  }
}

export function deactivate(): void {}
