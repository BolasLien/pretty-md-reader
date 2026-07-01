# Pretty MD Reader

Obsidian-style pretty rendering for VS Code's built-in Markdown preview. Elevate your Markdown reading experience with a light theme, callouts, Mermaid and Graphviz diagram rendering, styled task lists, and beautiful tables.

## Features

- **Obsidian-style Light Theme**: A clean, readable light theme inspired by Obsidian's design philosophy
- **GitHub/Obsidian Callouts**: Support for the 5 GitHub alert types (Note, Tip, Important, Warning, Caution), with case-insensitive Obsidian-style `> [!note]` syntax
- **Mermaid Diagrams**: Render Mermaid flowcharts, sequence diagrams, class diagrams, and more
- **Graphviz (Dot) Diagrams**: Support for Graphviz dot syntax for advanced graph rendering
- **Styled Task Lists**: Beautiful checkboxes for Markdown task lists
- **Enhanced Tables**: Purple header, zebra striping, and rounded corners for a polished look
- **Cross-Platform**: Consistent rendering across Windows, macOS, and Linux

## Color theme

Choose the preview's accent color in VS Code settings:

- Open Settings and search for **Pretty MD Reader: Theme**, or set `prettyMdReader.theme` in `settings.json`.
- Presets (all light): `purple` (default), `blue`, `green`, `rose`.

Only the accent family changes (headings, links, table headers, callout titles, inline code). Body text and code blocks stay the same across presets.

> After changing the theme, reload the open preview (edit the document, or close and reopen the preview) for the new accent to take effect.

## How to Use

1. Open any Markdown file in VS Code
2. Run the built-in preview using the **Preview** button or press **Cmd+Shift+V** (macOS) / **Ctrl+Shift+V** (Windows/Linux)
3. The extension automatically applies Pretty MD Reader styling to the preview

## Example

See `samples/sample.md` for a complete demonstration of all supported features, including callouts, Mermaid and Graphviz diagrams, task lists, and tables.

## Requirements

- VS Code 1.85.0 or later

## Theme Support

Pretty MD Reader supports **light theme only**. Ensure your VS Code color theme is set to a light variant for optimal rendering.

## License

MIT — see LICENSE file for details.
