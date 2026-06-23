import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const builds = [
  {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    external: ['vscode'],
    outfile: 'out/extension.js',
  },
  {
    entryPoints: ['src/webview/diagram-init.ts'],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: 'media/diagram-init.js',
  },
]

if (watch) {
  for (const b of builds) (await esbuild.context(b)).watch()
  console.log('watching...')
} else {
  await Promise.all(builds.map((b) => esbuild.build(b)))
  console.log('build complete')
}
