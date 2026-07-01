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
