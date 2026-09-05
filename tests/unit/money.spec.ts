import { describe, expect, it } from 'vitest'
import { formatVnd, parseVndInput, sumAmounts } from '../../app/utils/money'

describe('money utils', () => {
  it('formats VND with thousand separators', () => {
    expect(formatVnd(500000)).toBe('500.000 ₫')
    expect(formatVnd(15500000)).toBe('15.500.000 ₫')
  })

  it('parses numeric input with separators', () => {
    expect(parseVndInput('500.000')).toBe(500000)
    expect(parseVndInput('1,200,000')).toBe(1200000)
    expect(parseVndInput('0')).toBeNull()
    expect(parseVndInput('abc')).toBeNull()
  })

  it('sums amounts as integers', () => {
    expect(sumAmounts([100, 200, 300])).toBe(600)
  })
})
