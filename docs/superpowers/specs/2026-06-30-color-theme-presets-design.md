# Color Theme Presets — Design Spec

**Goal:** Let users pick a color theme for the Pretty MD Reader preview from a small set of built-in light presets, via a VS Code setting.

**Status:** Approved (2026-06-30). Scope expansion beyond the original plan, which listed "settings UI" and "dark mode" as out of scope. This adds a single enum setting (no custom settings UI) and stays **light-only** (no dark presets).

## Scope

In scope:
- A `prettyMdReader.theme` enum setting with 4 light presets: `purple` (default), `blue`, `green`, `rose`.
- Applying the chosen preset to the built-in Markdown preview by overriding the accent CSS variables.

Out of scope (unchanged from original constraints):
- Dark mode / dark presets.
- Per-variable custom colors or a custom hex picker.
- A dedicated settings UI / webview.
- Theming Mermaid/Graphviz diagram internals.

## Preset Palettes

Each preset overrides **only the four accent-related CSS variables**. The four neutral variables (`--pmr-text`, `--pmr-muted`, `--pmr-code-bg`, `--pmr-code-fg`) are shared across all presets and never change — this keeps presets consistent and the palette definitions small.

Overridden per preset:
- `--pmr-accent` — headings, table header text, callout title.
- `--pmr-accent-soft` — links, h3, callout left border.
- `--pmr-accent-bg` — inline code bg, table header bg, callout bg.
- `--pmr-border` — borders, hr, diagram frames.

`purple` is the existing palette (the default `:root` block in `media/preview.css`) and is the default value. Concrete hex values for `blue`, `green`, `rose` are chosen during implementation to read comfortably on the white background; each must keep its `--pmr-accent` readable as heading text and its `--pmr-accent-bg` light enough for dark inline-code text.

## Architecture

Two units, mirroring the existing `diagrams.ts` (pure) + `extension.ts` (vscode glue) split:

### `src/themes.ts` (pure, unit-tested)
- A palette map: theme name → the four accent variable values.
- `buildThemeStyle(theme: string): string` — returns an HTML `<style>:root{ --pmr-accent: …; --pmr-accent-soft: …; --pmr-accent-bg: …; --pmr-border: …; }</style>` string for the given theme.
  - For `purple` (the default, already in CSS): returns `''` (no override needed).
  - For an unknown / unset value: falls back to `purple` → returns `''`.
- No VS Code or DOM dependency, so it is testable in plain Node/Vitest.

### `src/extension.ts` (vscode glue)
- In `extendMarkdownIt`, wrap the configured `md` so that at render time it:
  1. Reads `vscode.workspace.getConfiguration('prettyMdReader').get('theme')`.
  2. Prepends `buildThemeStyle(theme)` to the rendered HTML output.
- Reading config at render time (not at activation) means each render picks up the current value, so a preview refresh applies the latest setting.
- This adds a `vscode` import to `extension.ts`. The existing pure unit tests move their assertions to `themes.ts`; `extension.ts` keeps the `extendMarkdownIt`/`diagramsPlugin`/`github-alerts` wiring it already has.

### `media/preview.css`
- Structurally unchanged. The default `:root` block (purple) stays as the base/fallback. The injected `<style>` from `buildThemeStyle` overrides `:root` for non-default themes.

### `package.json`
- Add `contributes.configuration`:
  - `prettyMdReader.theme`: `type: "string"`, `enum: ["purple","blue","green","rose"]`, `default: "purple"`, with a clear description and `enumDescriptions`.

## Data Flow

```
VS Code setting (prettyMdReader.theme)
        │  read at render time
        ▼
extension.ts render hook ──► themes.buildThemeStyle(name) ──► "<style>:root{…}</style>"
        │ prepend to rendered HTML
        ▼
Built-in Markdown preview (inline <style> overrides preview.css :root)
```

## Why inline `<style>`

`contributes.markdown.previewStyles` is a static CSS file and cannot be swapped at runtime, and the `previewScripts` webview script cannot read VS Code settings. The extension host *can* read settings inside `extendMarkdownIt`. VS Code's Markdown preview permits inline `<style>` in rendered content (authors routinely use it), so prepending a `<style>` block is the reliable way to feed a runtime-chosen palette into the static stylesheet.

## Known Limitation (v1)

Changing `prettyMdReader.theme` does **not** auto-refresh an already-open preview. VS Code has no stable public API for an extension to force-refresh the Markdown preview. The new value applies on the next preview render — i.e. after editing the document or closing and reopening the preview. This is documented in the README. Auto-refresh on config change was considered and deferred.

## Error Handling

- Unknown or missing `theme` value → treated as `purple` (no override). No throw.
- `buildThemeStyle` never throws; it only emits a string from a known map.

## Testing

- `test/themes.test.ts` (unit):
  - Each non-default theme produces a `<style>` containing its four `--pmr-*` variables.
  - `purple` returns `''`.
  - An unknown value (e.g. `"chartreuse"`, `""`, `undefined`) returns `''` (purple fallback).
- Manual visual acceptance: set `prettyMdReader.theme` to each preset, reload the preview of `samples/sample.md`, confirm headings/links/table header/callouts adopt the new accent and the page stays readable.
- Existing `diagrams.test.ts` continues to pass unchanged.

## Documentation

- README: document the `prettyMdReader.theme` setting, list the presets, and note the "reload preview to apply" behavior.
- CHANGELOG: add an entry under the next version.
