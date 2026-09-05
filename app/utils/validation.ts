import type { ExpenseInput } from '~/types'

export type ExpenseValidationResult = {
  isValid: boolean
  errors: Partial<Record<keyof ExpenseInput | 'amount', string>>
}

/**
 * Validate expense form values before create/update.
 */
export const validateExpenseInput = (input: {
  amount: number | null
  category_id: string
  expense_date: string
  member_id: string
  description?: string
}): ExpenseValidationResult => {
  const errors: ExpenseValidationResult['errors'] = {}

  if (input.amount === null || !Number.isInteger(input.amount) || input.amount <= 0) {
    errors.amount = 'Số tiền phải là số nguyên lớn hơn 0.'
  }

  if (!input.category_id) {
    errors.category_id = 'Vui lòng chọn danh mục.'
  }

  if (!input.expense_date || !/^\d{4}-\d{2}-\d{2}$/.test(input.expense_date)) {
    errors.expense_date = 'Ngày chi tiêu bắt buộc (YYYY-MM-DD).'
  }

  if (!input.member_id) {
    errors.member_id = 'Vui lòng chọn thành viên.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Aggregate expense totals by category id.
 */
export const calculateCategoryTotals = (
  expenses: Array<{ category_id: string; amount: number }>,
  categoryNames: Record<string, string>,
): Array<{ categoryId: string; categoryName: string; total: number }> => {
  const totals = new Map<string, number>()

  for (const expense of expenses) {
    const current = totals.get(expense.category_id) ?? 0
    totals.set(expense.category_id, current + Math.trunc(expense.amount))
  }

  return Array.from(totals.entries())
    .map(([categoryId, total]) => ({
      categoryId,
      categoryName: categoryNames[categoryId] ?? 'Khác',
      total,
    }))
    .sort((left, right) => right.total - left.total)
}

/**
 * Aggregate expense totals by member id.
 */
export const calculateMemberTotals = (
  expenses: Array<{ member_id: string; amount: number }>,
  memberNames: Record<string, string>,
): Array<{ memberId: string; displayName: string; total: number }> => {
  const totals = new Map<string, number>()

  for (const expense of expenses) {
    const current = totals.get(expense.member_id) ?? 0
    totals.set(expense.member_id, current + Math.trunc(expense.amount))
  }

  return Array.from(totals.entries())
    .map(([memberId, total]) => ({
      memberId,
      displayName: memberNames[memberId] ?? 'Unknown',
      total,
    }))
    .sort((left, right) => right.total - left.total)
}

/**
 * Sum expenses for monthly total.
 */
export const calculateMonthlyTotal = (
  expenses: Array<{ amount: number }>,
): number => {
  let total = 0

  for (const expense of expenses) {
    total += Math.trunc(expense.amount)
  }

  return total
}
