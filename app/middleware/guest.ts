/**
 * Redirect authenticated users away from guest-only pages.
 */
export default defineNuxtRouteMiddleware(async () => {
  const { user, isLoading, refreshSession } = useAuth()
  const { hasFamily, loadFamilyContext } = useFamily()

  if (isLoading.value) {
    await refreshSession()
  }

  if (!user.value) {
    return
  }

  await loadFamilyContext()

  if (!hasFamily.value) {
    return navigateTo('/onboarding')
  }

  return navigateTo('/')
})
