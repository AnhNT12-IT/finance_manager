/**
 * Require family membership; otherwise send to onboarding.
 */
export default defineNuxtRouteMiddleware(async () => {
  const { user, isLoading: isAuthLoading, refreshSession } = useAuth()
  const { hasFamily, isLoading: isFamilyLoading, loadFamilyContext } = useFamily()

  if (isAuthLoading.value) {
    await refreshSession()
  }

  if (!user.value) {
    return navigateTo('/login')
  }

  if (!hasFamily.value && !isFamilyLoading.value) {
    await loadFamilyContext()
  }

  if (!hasFamily.value) {
    return navigateTo('/onboarding')
  }
})
