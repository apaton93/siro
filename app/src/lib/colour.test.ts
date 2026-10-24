import { describe, expect, it } from 'vitest'
import { bandFade, hexToRgb, rgba } from './colour'

describe('team colours', () => {
  it('parses #RRGGBB', () => {
    expect(hexToRgb('#F47920')).toEqual({ r: 244, g: 121, b: 32 })
    expect(hexToRgb('#003399')).toEqual({ r: 0, g: 51, b: 153 })
  })

  it('falls back to Siro ink for invalid colours', () => {
    expect(hexToRgb('orange')).toEqual({ r: 11, g: 11, b: 12 })
    expect(hexToRgb('#FFF')).toEqual({ r: 11, g: 11, b: 12 })
  })

  it('builds rgba strings', () => {
    expect(rgba('#003399', 0.6)).toBe('rgba(0, 51, 153, 0.6)')
  })

  it('keeps the bottom of the band fully solid behind the text', () => {
    const fade = bandFade('#F47920', 45)
    expect(fade).toContain('rgba(244, 121, 32, 1) 0%')
    expect(fade).toContain('rgba(244, 121, 32, 1) 45%')
  })
})
