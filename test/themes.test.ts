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
