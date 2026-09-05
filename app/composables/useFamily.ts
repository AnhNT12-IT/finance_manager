import type { Category, Family, FamilyMember } from '~/types'

/**
 * Family membership, create family, settings actions.
 */
export const useFamily = () => {
  const supabase = useSupabase()
  const family = useState<Family | null>('family', () => null)
  const members = useState<FamilyMember[]>('family-members', () => [])
  const categories = useState<Category[]>('family-categories', () => [])
  const currentMember = useState<FamilyMember | null>('current-member', () => null)
  const isLoading = useState<boolean>('family-loading', () => false)
  const errorMessage = useState<string | null>('family-error', () => null)

  const isOwner = computed(() => currentMember.value?.role === 'OWNER')
  const hasFamily = computed(() => Boolean(family.value))

  /**
   * Load current user's family, members, and categories.
   */
  const loadFamilyContext = async () => {
    isLoading.value = true
    errorMessage.value = null

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        family.value = null
        members.value = []
        categories.value = []
        currentMember.value = null
        return null
      }

      const { data: membership, error: membershipError } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle()

      if (membershipError) {
        throw membershipError
      }

      if (!membership) {
        family.value = null
        members.value = []
        categories.value = []
        currentMember.value = null
        return null
      }

      currentMember.value = membership as FamilyMember

      const { data: familyRow, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', membership.family_id)
        .single()

      if (familyError) {
        throw familyError
      }

      family.value = familyRow as Family

      const [{ data: memberRows, error: membersError }, { data: categoryRows, error: categoriesError }] =
        await Promise.all([
          supabase
            .from('family_members')
            .select('*')
            .eq('family_id', membership.family_id)
            .order('created_at', { ascending: true }),
          supabase
            .from('categories')
            .select('*')
            .eq('family_id', membership.family_id)
            .order('name', { ascending: true }),
        ])

      if (membersError) {
        throw membersError
      }

      if (categoriesError) {
        throw categoriesError
      }

      members.value = (memberRows ?? []) as FamilyMember[]
      categories.value = (categoryRows ?? []) as Category[]

      return family.value
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Không tải được thông tin gia đình.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create family for users without membership.
   */
  const createFamily = async (name: string, displayName?: string) => {
    isLoading.value = true
    errorMessage.value = null

    try {
      const { data, error } = await supabase.rpc('create_family_with_defaults', {
        p_name: name.trim(),
        p_display_name: displayName?.trim() || null,
      })

      if (error) {
        throw error
      }

      await loadFamilyContext()

      return data as Family
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Tạo gia đình thất bại.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Rename family (OWNER).
   */
  const renameFamily = async (name: string) => {
    if (!family.value) {
      throw new Error('Chưa có gia đình.')
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      const { data, error } = await supabase
        .from('families')
        .update({ name: name.trim() })
        .eq('id', family.value.id)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      family.value = data as Family

      return family.value
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Đổi tên thất bại.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Add member by registered email (OWNER).
   */
  const addMemberByEmail = async (email: string, displayName?: string) => {
    isLoading.value = true
    errorMessage.value = null

    try {
      const { error } = await supabase.rpc('add_family_member_by_email', {
        p_email: email.trim(),
        p_display_name: displayName?.trim() || null,
      })

      if (error) {
        throw error
      }

      await loadFamilyContext()
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Thêm thành viên thất bại.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Remove member (OWNER).
   */
  const removeMember = async (memberId: string) => {
    isLoading.value = true
    errorMessage.value = null

    try {
      const { error } = await supabase.rpc('remove_family_member', {
        p_member_id: memberId,
      })

      if (error) {
        throw error
      }

      await loadFamilyContext()
    } catch (error) {
      console.error(error)
      errorMessage.value = error instanceof Error ? error.message : 'Xóa thành viên thất bại.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear family state on logout.
   */
  const clearFamilyState = () => {
    family.value = null
    members.value = []
    categories.value = []
    currentMember.value = null
    errorMessage.value = null
  }

  return {
    family,
    members,
    categories,
    currentMember,
    isLoading,
    errorMessage,
    isOwner,
    hasFamily,
    loadFamilyContext,
    createFamily,
    renameFamily,
    addMemberByEmail,
    removeMember,
    clearFamilyState,
  }
}
