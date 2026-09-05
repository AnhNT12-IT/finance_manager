import type { Expense, ExpenseFilters, ExpenseInput, ExpenseWithRelations } from '~/types'
import { getMonthDateRange } from '~/utils/date'
import { validateExpenseInput } from '~/utils/validation'

/**
 * Expense CRUD, filters, search, pagination.
 */
export const useExpenses = () => {
  const supabase = useSupabase()
  const { family } = useFamily()

  const expenses = useState<ExpenseWithRelations[]>('expenses-list', () => [])
  const totalCount = useState<number>('expenses-total', () => 0)
  const isLoading = useState<boolean>('expenses-loading', () => false)
  const errorMessage = useState<string | null>('expenses-error', () => null)

  /**
   * Fetch expenses with optional filters.
   */
  const fetchExpenses = async (filters: ExpenseFilters = {}) => {
    if (!family.value) {
      expenses.value = []
      totalCount.value = 0
      return []
    }

    isLoading.value = true
    errorMessage.value = null

    const page = filters.page && filters.page > 0 ? filters.page : 1
    const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    try {
      let query = supabase
        .from('expenses')
        .select('*, category:categories(id, name), member:family_members(id, display_name)', {
          count: 'exact',
        })
        .eq('family_id', family.value.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters.month) {
        const { start, end } = getMonthDateRange(filters.month)
        query = query.gte('expense_date', start).lte('expense_date', end)
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters.memberId) {
        query = query.eq('member_id', filters.memberId)
      }

      if (filters.search?.trim()) {
        query = query.ilike('description', `%${filters.search.trim()}%`)
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      expenses.value = (data ?? []) as ExpenseWithRelations[]
      totalCount.value = count ?? 0

      return expenses.value
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Không tải được danh sách chi tiêu.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create expense after client validation.
   */
  const createExpense = async (input: ExpenseInput) => {
    if (!family.value) {
      throw new Error('Chưa có gia đình.')
    }

    const validation = validateExpenseInput(input)

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Dữ liệu không hợp lệ.')
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          family_id: family.value.id,
          member_id: input.member_id,
          category_id: input.category_id,
          amount: input.amount,
          description: input.description?.trim() || null,
          expense_date: input.expense_date,
        })
        .select('*')
        .single()

      if (error) {
        throw error
      }

      return data as Expense
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Tạo chi tiêu thất bại.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update expense.
   */
  const updateExpense = async (expenseId: string, input: ExpenseInput) => {
    if (!family.value) {
      throw new Error('Chưa có gia đình.')
    }

    const validation = validateExpenseInput(input)

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Dữ liệu không hợp lệ.')
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          member_id: input.member_id,
          category_id: input.category_id,
          amount: input.amount,
          description: input.description?.trim() || null,
          expense_date: input.expense_date,
        })
        .eq('id', expenseId)
        .eq('family_id', family.value.id)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      return data as Expense
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Cập nhật chi tiêu thất bại.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete expense.
   */
  const deleteExpense = async (expenseId: string) => {
    if (!family.value) {
      throw new Error('Chưa có gia đình.')
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('family_id', family.value.id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Xóa chi tiêu thất bại.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    expenses,
    totalCount,
    isLoading,
    errorMessage,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  }
}
