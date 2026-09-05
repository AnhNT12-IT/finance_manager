export type MemberRole = 'OWNER' | 'MEMBER'

export type Profile = {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export type Family = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type FamilyMember = {
  id: string
  family_id: string
  user_id: string
  display_name: string
  role: MemberRole
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  family_id: string
  name: string
  created_at: string
  updated_at: string
}

export type Expense = {
  id: string
  family_id: string
  member_id: string
  category_id: string
  amount: number
  description: string | null
  expense_date: string
  created_at: string
  updated_at: string
}

export type ExpenseWithRelations = Expense & {
  category?: Pick<Category, 'id' | 'name'> | null
  member?: Pick<FamilyMember, 'id' | 'display_name'> | null
}

export type ExpenseInput = {
  amount: number
  category_id: string
  description?: string
  expense_date: string
  member_id: string
}

export type ExpenseFilters = {
  month?: string
  categoryId?: string
  memberId?: string
  search?: string
  page?: number
  pageSize?: number
}

export type CategoryStat = {
  categoryId: string
  categoryName: string
  total: number
}

export type MemberStat = {
  memberId: string
  displayName: string
  total: number
}

export type DashboardData = {
  year: number
  month: number
  monthlyTotal: number
  byCategory: CategoryStat[]
  byMember: MemberStat[]
  recent: ExpenseWithRelations[]
}
