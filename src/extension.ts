import type MarkdownIt from 'markdown-it'
import githubAlerts from 'markdown-it-github-alerts'
import { diagramsPlugin } from './markdown-it/diagrams'

export function activate() {
  return {
    extendMarkdownIt(md: MarkdownIt) {
      return md.use(githubAlerts, { matchCaseSensitive: false }).use(diagramsPlugin)
    },
  }
}

export function deactivate(): void {}
