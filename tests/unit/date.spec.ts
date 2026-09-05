import { describe, expect, it } from 'vitest'
import { getMonthDateRange, formatMonthLabel, formatShortDate } from '../../app/utils/date'

describe('date utils', () => {
  it('builds inclusive month range', () => {
    expect(getMonthDateRange('2026-09')).toEqual({
      start: '2026-09-01',
      end: '2026-09-30',
    })
    expect(getMonthDateRange('2026-02')).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    })
  })

  it('formats labels', () => {
    expect(formatMonthLabel('2026-09')).toBe('9/2026')
    expect(formatShortDate('2026-09-03')).toBe('03/09')
  })
})
