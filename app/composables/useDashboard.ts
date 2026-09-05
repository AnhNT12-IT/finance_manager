import type { DashboardData, ExpenseWithRelations } from '~/types'
import {
  formatMonthLabel,
  getCurrentMonthKey,
  getMonthDateRange,
  getVietnamDateParts,
} from '~/utils/date'
import {
  calculateCategoryTotals,
  calculateMemberTotals,
  calculateMonthlyTotal,
} from '~/utils/validation'

/**
 * Dashboard monthly statistics for the current Vietnam month.
 */
export const useDashboard = () => {
  const supabase = useSupabase()
  const { family, members, categories } = useFamily()

  const dashboard = useState<DashboardData | null>('dashboard-data', () => null)
  const isLoading = useState<boolean>('dashboard-loading', () => false)
  const errorMessage = useState<string | null>('dashboard-error', () => null)

  /**
   * Load monthly totals, category/member breakdown, and recent expenses.
   */
  const loadDashboard = async (monthKey: string = getCurrentMonthKey()) => {
    if (!family.value) {
      dashboard.value = null
      return null
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      const { start, end } = getMonthDateRange(monthKey)
      const [yearText, monthText] = monthKey.split('-')

      const { data, error } = await supabase
        .from('expenses')
        .select('*, category:categories(id, name), member:family_members(id, display_name)')
        .eq('family_id', family.value.id)
        .gte('expense_date', start)
        .lte('expense_date', end)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const rows = (data ?? []) as ExpenseWithRelations[]
      const categoryNames = Object.fromEntries(categories.value.map((item) => [item.id, item.name]))
      const memberNames = Object.fromEntries(members.value.map((item) => [item.id, item.display_name]))

      dashboard.value = {
        year: Number(yearText),
        month: Number(monthText),
        monthlyTotal: calculateMonthlyTotal(rows),
        byCategory: calculateCategoryTotals(rows, categoryNames),
        byMember: calculateMemberTotals(rows, memberNames),
        recent: rows.slice(0, 8),
      }

      return dashboard.value
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Không tải được bảng điều khiển.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const monthLabel = computed(() => {
    if (!dashboard.value) {
      const parts = getVietnamDateParts()
      return formatMonthLabel(`${parts.year}-${String(parts.month).padStart(2, '0')}`)
    }

    return `${dashboard.value.month}/${dashboard.value.year}`
  })

  return {
    dashboard,
    isLoading,
    errorMessage,
    monthLabel,
    loadDashboard,
  }
}
