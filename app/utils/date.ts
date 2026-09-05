const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh' as const

/**
 * Get calendar parts in Asia/Ho_Chi_Minh.
 */
export const getVietnamDateParts = (date: Date = new Date()): {
  year: number
  month: number
  day: number
} => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
  }
}

/**
 * Today's date as YYYY-MM-DD in Vietnam timezone.
 */
export const getTodayDateString = (date: Date = new Date()): string => {
  const { year, month, day } = getVietnamDateParts(date)
  const monthText = String(month).padStart(2, '0')
  const dayText = String(day).padStart(2, '0')

  return `${year}-${monthText}-${dayText}`
}

/**
 * Current month as YYYY-MM in Vietnam timezone.
 */
export const getCurrentMonthKey = (date: Date = new Date()): string => {
  const { year, month } = getVietnamDateParts(date)
  const monthText = String(month).padStart(2, '0')

  return `${year}-${monthText}`
}

/**
 * Inclusive date range for a YYYY-MM month key.
 */
export const getMonthDateRange = (monthKey: string): { start: string; end: string } => {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey)

  if (!match) {
    throw new Error('Invalid month key. Expected YYYY-MM.')
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (month < 1 || month > 12) {
    throw new Error('Invalid month value.')
  }

  const start = `${match[1]}-${match[2]}-01`
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const end = `${match[1]}-${match[2]}-${String(lastDay).padStart(2, '0')}`

  return { start, end }
}

/**
 * Format YYYY-MM-DD for UI (dd/MM).
 */
export const formatShortDate = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)

  if (!match) {
    return isoDate
  }

  return `${match[3]}/${match[2]}`
}

/**
 * Format month label e.g. 9/2026.
 */
export const formatMonthLabel = (monthKey: string): string => {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey)

  if (!match) {
    return monthKey
  }

  return `${Number(match[2])}/${match[1]}`
}
