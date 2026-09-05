import { describe, expect, it } from 'vitest'
import {
  calculateCategoryTotals,
  calculateMemberTotals,
  calculateMonthlyTotal,
  validateExpenseInput,
} from '../../app/utils/validation'

describe('expense validation', () => {
  it('rejects non-positive amount and missing fields', () => {
    const result = validateExpenseInput({
      amount: 0,
      category_id: '',
      expense_date: '',
      member_id: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.amount).toBeTruthy()
    expect(result.errors.category_id).toBeTruthy()
    expect(result.errors.expense_date).toBeTruthy()
    expect(result.errors.member_id).toBeTruthy()
  })

  it('accepts valid expense input', () => {
    const result = validateExpenseInput({
      amount: 500000,
      category_id: 'cat-1',
      expense_date: '2026-09-05',
      member_id: 'mem-1',
      description: 'Lunch',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })
})

describe('expense calculations', () => {
  const expenses = [
    { category_id: 'c1', member_id: 'm1', amount: 500000 },
    { category_id: 'c1', member_id: 'm2', amount: 250000 },
    { category_id: 'c2', member_id: 'm1', amount: 1000000 },
  ]

  it('calculates monthly total', () => {
    expect(calculateMonthlyTotal(expenses)).toBe(1750000)
  })

  it('calculates category totals sorted desc', () => {
    const result = calculateCategoryTotals(expenses, {
      c1: 'Ăn uống',
      c2: 'Mua sắm',
    })

    expect(result[0]).toEqual({
      categoryId: 'c2',
      categoryName: 'Mua sắm',
      total: 1000000,
    })
    expect(result[1].total).toBe(750000)
  })

  it('calculates member totals sorted desc', () => {
    const result = calculateMemberTotals(expenses, {
      m1: 'Anh',
      m2: 'A',
    })

    expect(result[0]).toEqual({
      memberId: 'm1',
      displayName: 'Anh',
      total: 1500000,
    })
    expect(result[1].total).toBe(250000)
  })
})
