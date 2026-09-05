/**
 * Require authenticated session.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, isLoading, refreshSession } = useAuth()

  if (isLoading.value) {
    await refreshSession()
  }

  if (!user.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})
