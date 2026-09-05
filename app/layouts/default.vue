<script setup lang="ts">
const route = useRoute()
const { user, logout } = useAuth()
const { family, clearFamilyState } = useFamily()

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))

/**
 * Logout and clear family state.
 */
const handleLogout = async () => {
  clearFamilyState()
  await logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="app-shell">
    <header
      v-if="!isAuthPage"
      class="app-header"
    >
      <NuxtLink
        to="/"
        class="brand"
      >
        {{ family?.name || 'Chi tiêu gia đình' }}
      </NuxtLink>

      <nav
        v-if="user"
        class="nav-links"
        aria-label="Điều hướng chính"
      >
        <NuxtLink
          class="nav-link"
          to="/"
        >
          Dashboard
        </NuxtLink>
        <NuxtLink
          class="nav-link"
          to="/expenses"
        >
          Chi tiêu
        </NuxtLink>
        <NuxtLink
          class="nav-link"
          to="/family"
        >
          Gia đình
        </NuxtLink>
        <button
          type="button"
          class="btn btn-ghost"
          aria-label="Đăng xuất"
          @click="handleLogout"
        >
          Đăng xuất
        </button>
      </nav>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>
