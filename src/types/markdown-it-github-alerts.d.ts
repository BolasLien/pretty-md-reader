declare module 'markdown-it-github-alerts' {
  import type { PluginWithOptions } from 'markdown-it'
  const plugin: PluginWithOptions<{ matchCaseSensitive?: boolean }>
  export default plugin
}
