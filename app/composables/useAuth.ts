import type { User, Session } from '@supabase/supabase-js'

/**
 * Auth state and email/password actions with session persistence.
 */
export const useAuth = () => {
  const supabase = useSupabase()
  const user = useState<User | null>('auth-user', () => null)
  const session = useState<Session | null>('auth-session', () => null)
  const isLoading = useState<boolean>('auth-loading', () => true)
  const authError = useState<string | null>('auth-error', () => null)

  /**
   * Sync session from Supabase into local state.
   */
  const refreshSession = async () => {
    isLoading.value = true
    authError.value = null

    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      session.value = data.session
      user.value = data.session?.user ?? null
    } catch (error) {
      console.error(error)
      session.value = null
      user.value = null
      authError.value = 'Không thể tải phiên đăng nhập.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Register with email/password.
   */
  const register = async (email: string, password: string, displayName: string) => {
    authError.value = null
    isLoading.value = true

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      })

      if (error) {
        throw error
      }

      session.value = data.session
      user.value = data.user

      return data
    } catch (error) {
      console.error(error)
      authError.value = error instanceof Error ? error.message : 'Đăng ký thất bại.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Login with email/password.
   */
  const login = async (email: string, password: string) => {
    authError.value = null
    isLoading.value = true

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        throw error
      }

      session.value = data.session
      user.value = data.user

      return data
    } catch (error) {
      console.error(error)
      authError.value = error instanceof Error ? error.message : 'Đăng nhập thất bại.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout and clear local auth state.
   */
  const logout = async () => {
    authError.value = null

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }
    } catch (error) {
      console.error(error)
      authError.value = error instanceof Error ? error.message : 'Đăng xuất thất bại.'
      throw error
    } finally {
      session.value = null
      user.value = null
    }
  }

  /**
   * Subscribe once to auth state changes.
   */
  const subscribeAuth = () => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      session.value = nextSession
      user.value = nextSession?.user ?? null
      isLoading.value = false
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }

  return {
    user,
    session,
    isLoading,
    authError,
    refreshSession,
    register,
    login,
    logout,
    subscribeAuth,
  }
}
