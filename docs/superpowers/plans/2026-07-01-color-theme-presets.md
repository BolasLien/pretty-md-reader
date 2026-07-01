# Color Theme Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users choose the preview's accent color from four built-in light presets via a `prettyMdReader.theme` VS Code setting.

**Architecture:** A pure `src/themes.ts` maps each non-default theme to its four accent CSS-variable values and builds an inline `<style>:root{…}</style>` override string. `src/extension.ts` reads the setting at render time and prepends that string to the rendered Markdown HTML, overriding the default `:root` palette shipped in `media/preview.css`.

**Tech Stack:** TypeScript, markdown-it, VS Code `contributes.configuration`, esbuild, Vitest.

## Global Constraints

- Appearance: **light mode only**. No dark presets, no theme-switching CSS beyond accents.
- Presets: `purple` (default), `blue`, `green`, `rose` — verbatim enum values.
- Each preset overrides **only** these four variables: `--pmr-accent`, `--pmr-accent-soft`, `--pmr-accent-bg`, `--pmr-border`. The neutral variables (`--pmr-text`, `--pmr-muted`, `--pmr-code-bg`, `--pmr-code-fg`) are shared and unchanged.
- `purple` is the palette already in `media/preview.css :root`; it needs no override (empty style string).
- Unknown / missing setting value → treated as `purple` (no override, no throw).
- `engines.vscode`: `^1.85.0`. `publisher`: `bolaslien`. Runtime stays offline (no network at preview time).
- GitHub-alert semantic colors (note/tip/warning/caution) stay fixed; they do **not** follow the accent.

---

## File Structure

- Create `src/themes.ts` — pure palette map + `buildThemeStyle(theme)`; no VS Code/DOM deps.
- Create `test/themes.test.ts` — unit tests for `buildThemeStyle`.
- Modify `src/extension.ts` — read the setting (guarded `require('vscode')`) and prepend the style block in `extendMarkdownIt`.
- Modify `package.json` — add `contributes.configuration` for `prettyMdReader.theme`; bump version.
- Modify `media/preview.css:36` — inline `code` text color from hardcoded `#6d4ee0` to `var(--pmr-accent-soft)` so inline code recolors with the theme.
- Modify `README.md`, `CHANGELOG.md` — document the setting.

---

### Task 1: Pure theme palette module

**Files:**
- Create: `src/themes.ts`
- Test: `test/themes.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export function buildThemeStyle(theme: string | undefined): string` — returns an inline `<style>` block overriding the four accent variables for `blue`/`green`/`rose`, and `''` for `purple` or any unknown/empty/undefined value.

- [ ] **Step 1: Write the failing test**

Create `test/themes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildThemeStyle } from '../src/themes'

describe('buildThemeStyle', () => {
  it('returns empty string for the default purple theme', () => {
    expect(buildThemeStyle('purple')).toBe('')
  })

  it('returns empty string for unknown / empty / undefined values', () => {
    expect(buildThemeStyle('chartreuse')).toBe('')
    expect(buildThemeStyle('')).toBe('')
    expect(buildThemeStyle(undefined)).toBe('')
  })

  it('emits a style block with all four accent variables for blue', () => {
    const out = buildThemeStyle('blue')
    expect(out).toContain('<style>')
    expect(out).toContain('--pmr-accent:#2f6fe0;')
    expect(out).toContain('--pmr-accent-soft:#4c8dff;')
    expect(out).toContain('--pmr-accent-bg:#e8f0ff;')
    expect(out).toContain('--pmr-border:#d9e5fb;')
  })

  it('emits distinct accents for green and rose', () => {
    expect(buildThemeStyle('green')).toContain('--pmr-accent:#1e9e57;')
    expect(buildThemeStyle('rose')).toContain('--pmr-accent:#c22f63;')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/themes`.

- [ ] **Step 3: Write minimal implementation**

Create `src/themes.ts`:

```ts
export type ThemeName = 'purple' | 'blue' | 'green' | 'rose'

interface AccentPalette {
  accent: string
  accentSoft: string
  accentBg: string
  border: string
}

// 'purple' is the default palette already present in media/preview.css :root,
// so it needs no override and is intentionally absent from this map.
const PALETTES: Record<Exclude<ThemeName, 'purple'>, AccentPalette> = {
  blue: { accent: '#2f6fe0', accentSoft: '#4c8dff', accentBg: '#e8f0ff', border: '#d9e5fb' },
  green: { accent: '#1e9e57', accentSoft: '#2ecc71', accentBg: '#e6f7ee', border: '#d3efdf' },
  rose: { accent: '#c22f63', accentSoft: '#e05a86', accentBg: '#ffe9f0', border: '#f6d5e1' },
}

/**
 * Returns an inline <style> block overriding the accent CSS variables for the
 * given theme, to be prepended to the rendered Markdown HTML. Returns '' for
 * the default 'purple' theme and for any unknown value (both fall back to the
 * built-in :root palette in media/preview.css).
 */
export function buildThemeStyle(theme: string | undefined): string {
  const palette = PALETTES[theme as Exclude<ThemeName, 'purple'>]
  if (!palette) return ''
  return (
    `<style>:root{` +
    `--pmr-accent:${palette.accent};` +
    `--pmr-accent-soft:${palette.accentSoft};` +
    `--pmr-accent-bg:${palette.accentBg};` +
    `--pmr-border:${palette.border};` +
    `}</style>`
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (new `themes.test.ts` 4 tests; existing suites still pass).

- [ ] **Step 5: Commit**

```bash
git add src/themes.ts test/themes.test.ts
git commit -m "feat: add theme palette module for preview accent presets"
```

---

### Task 2: Wire the setting into the preview

**Files:**
- Modify: `src/extension.ts`
- Modify: `package.json` (add `contributes.configuration`, bump version)
- Modify: `media/preview.css:36`

**Interfaces:**
- Consumes: `buildThemeStyle` from Task 1; `activate().extendMarkdownIt(md)` from the existing extension.
- Produces: at render time, the rendered HTML is prefixed with `buildThemeStyle(<configured theme>)`. In unit tests (no `vscode` module) the theme resolves to `'purple'`, so output is unchanged and existing tests still pass.

- [ ] **Step 1: Update `src/extension.ts`**

Replace the whole file with:

```ts
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
```

- [ ] **Step 2: Run tests to verify existing behavior is unchanged**

Run: `npm test`
Expected: PASS — `themes.test.ts`, `diagrams.test.ts`, and `extension.test.ts` all green (the theme resolves to `'purple'` in tests, so injected style is `''`).

- [ ] **Step 3: Add the setting to `package.json`**

Inside the `"contributes"` object, add a `"configuration"` entry alongside the existing `markdown.*` keys:

```json
    "configuration": {
      "title": "Pretty MD Reader",
      "properties": {
        "prettyMdReader.theme": {
          "type": "string",
          "enum": ["purple", "blue", "green", "rose"],
          "enumDescriptions": [
            "Obsidian-style purple (default)",
            "Blue accent",
            "Green accent",
            "Rose accent"
          ],
          "default": "purple",
          "description": "Accent color theme for the Markdown preview. Reload the preview to apply a change."
        }
      }
    }
```

Also bump the top-level `"version"` from `"0.0.1"` to `"0.1.0"`.

- [ ] **Step 4: Recolor inline code text in `media/preview.css`**

At line 36, change the inline `code` text color so it follows the theme accent:

```css
  color: var(--pmr-accent-soft);
```

(replacing `color: #6d4ee0;`). Leave every other rule untouched — the GitHub-alert semantic colors and the near-white table zebra stay as-is.

- [ ] **Step 5: Build to verify it compiles and bundles**

Run: `npm run build`
Expected: `build complete`; `out/extension.js` exists.

Verify: `node -e "require('./out/extension.js').activate().then(() => console.log('ok'))"`
Expected: prints `ok` (activation resolves; no throw).

- [ ] **Step 6: Commit**

```bash
git add src/extension.ts package.json media/preview.css
git commit -m "feat: apply prettyMdReader.theme accent presets to preview"
```

---

### Task 3: Documentation, version notes, and visual acceptance

**Files:**
- Modify: `README.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: the setting from Task 2.
- Produces: user-facing docs; manually verified appearance for each preset.

- [ ] **Step 1: Document the setting in `README.md`**

Add a section (place it after the features list):

```markdown
## Color theme

Choose the preview's accent color in VS Code settings:

- Open Settings and search for **Pretty MD Reader: Theme**, or set `prettyMdReader.theme` in `settings.json`.
- Presets (all light): `purple` (default), `blue`, `green`, `rose`.

Only the accent family changes (headings, links, table headers, callout titles, inline code). Body text and code blocks stay the same across presets.

> After changing the theme, reload the open preview (edit the document, or close and reopen the preview) for the new accent to take effect.
```

- [ ] **Step 2: Add a `CHANGELOG.md` entry**

Add above the `## 0.0.1` entry:

```markdown
## 0.1.0
- Add `prettyMdReader.theme` setting with four light accent presets: purple (default), blue, green, rose.
```

- [ ] **Step 3: Manual visual acceptance**

Run `npm run build`, press F5 (Extension Development Host), open `samples/sample.md`, and open the preview (`Cmd+Shift+V`). For each of `blue`, `green`, `rose`:
- Set `prettyMdReader.theme` in the dev-host settings.
- Reload the preview (re-open it or edit the file).
- Verify headings, links, h3, table header, callout titles, and inline code adopt the new accent; body text and code blocks are unchanged; the page stays readable on white.
- Set it back to `purple` (or clear it) and confirm the original look returns.

If any preset reads poorly, adjust the hex values in `src/themes.ts` (and the purple base in `media/preview.css` only if the default itself is affected) and re-verify before committing.

- [ ] **Step 4: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: document prettyMdReader.theme presets"
```

---

## Self-Review

**Spec coverage:**
- `prettyMdReader.theme` enum with purple/blue/green/rose → Task 2 Step 3. ✓
- Four presets, light-only, override only the 4 accent vars → Task 1 `PALETTES` + `buildThemeStyle`. ✓
- Pure, unit-tested `themes.ts` (buildThemeStyle) → Task 1. ✓
- extension.ts vscode glue reads config at render time, prepends `<style>` → Task 2 Step 1. ✓
- Default/unknown → purple (no override, no throw) → Task 1 tests + `getConfiguredTheme` fallback. ✓
- preview.css structurally intact (only the inline-code accent leak fixed) → Task 2 Step 4. ✓
- Existing tests keep passing → Task 2 Step 2. ✓
- Known limitation (reload to apply) documented → Task 3 Step 1; setting description in Task 2 Step 3. ✓
- README + CHANGELOG → Task 3. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full content. Concrete hex values are fixed in Task 1.

**Type consistency:** `buildThemeStyle(theme: string | undefined): string` defined in Task 1 and called identically in Task 2. Variable names `--pmr-accent`, `--pmr-accent-soft`, `--pmr-accent-bg`, `--pmr-border` match `media/preview.css` and the injected block. Enum values `purple/blue/green/rose` match between `package.json`, `PALETTES` keys, and tests.
