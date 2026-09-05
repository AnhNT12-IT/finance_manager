/**
 * Format VND integer amount for display (vi-VN).
 */
export const formatVnd = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    return '0 ₫'
  }

  const safeAmount = Math.trunc(amount)
  const formatted = new Intl.NumberFormat('vi-VN').format(safeAmount)

  return `${formatted} ₫`
}

/**
 * Parse user money input into a positive integer VND amount.
 * Accepts digits with optional thousand separators (. or , or spaces).
 */
export const parseVndInput = (raw: string): number | null => {
  const normalized = raw.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '')

  if (!/^\d+$/.test(normalized)) {
    return null
  }

  const value = Number(normalized)

  if (!Number.isSafeInteger(value) || value <= 0) {
    return null
  }

  return value
}

/**
 * Sum BIGINT-safe amounts without floating point.
 */
export const sumAmounts = (amounts: number[]): number => {
  let total = 0

  for (const amount of amounts) {
    total += Math.trunc(amount)
  }

  return total
}
